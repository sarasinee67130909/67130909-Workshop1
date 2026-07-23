// services/order.service.js — สร้าง/ดู/ยกเลิกออเดอร์ + แนบสลิป + ตรวจโค้ดส่วนลด
// สำคัญ: การสร้างและยกเลิกออเดอร์อยู่ใน MySQL transaction — ตัด/คืนสต็อกระดับ variant
const pool = require('../config/db');
const { ORDER_STATUS } = require('../utils/orderStatus');
const { httpError, isPositiveInt, isNonEmptyString } = require('../utils/validators');
const { NOTIFICATION_TYPE } = require('../utils/notificationType');
const notificationService = require('./notification.service');

// แจ้งเตือน staff แบบ fire-and-forget — พลาดได้โดยไม่กระทบ flow หลักของลูกค้า
// export ไว้ให้ review.service.js เรียกใช้ร่วมด้วย (กันเขียน catch/log ซ้ำ)
function notifyStaff(payload) {
  notificationService.createNotification(payload).catch((err) => {
    console.error('สร้างการแจ้งเตือน staff ไม่สำเร็จ:', err);
  });
}

// เลขออเดอร์ที่โชว์ในข้อความแจ้งเตือน — รูปแบบเดียวกันทุกจุดที่อ้างถึงออเดอร์
function formatOrderCode(orderId) {
  return `#ORD-${String(orderId).padStart(4, '0')}`;
}

// ── ตรวจโค้ดส่วนลด (ใช้ร่วมกันทั้ง validate-promo และตอนสร้างออเดอร์จริง) ──
// conn = connection ใน transaction หรือ pool ปกติก็ได้
// userId = ผู้ใช้ที่กำลังตรวจโค้ด (อาจเป็น null ถ้ายังไม่ล็อกอิน) — ใช้เช็คสิทธิ์โค้ดที่ถูก push เข้ากระเป๋าใครไว้แล้ว
async function checkPromo(conn, code, subtotal, userId) {
  const [rows] = await conn.execute('SELECT * FROM promo_codes WHERE code = ?', [code]);
  if (rows.length === 0) throw httpError(400, 'ไม่พบโค้ดส่วนลดนี้');

  const promo = rows[0];
  if (!promo.is_active) throw httpError(400, 'โค้ดนี้ถูกปิดใช้งานแล้ว');
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    throw httpError(400, 'โค้ดนี้หมดอายุแล้ว');
  }
  if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
    throw httpError(400, 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว');
  }
  if (Number(subtotal) < Number(promo.min_order_total)) {
    throw httpError(
      400,
      `ยอดสั่งซื้อขั้นต่ำ ${Number(promo.min_order_total).toLocaleString('th-TH')} บาทจึงจะใช้โค้ดนี้ได้`
    );
  }

  // โค้ดที่เคยถูก push เข้ากระเป๋าใครแล้ว (มีแถวใน user_coupons) ใช้ได้เฉพาะเจ้าของกระเป๋าเท่านั้น
  // โค้ด public เดิมที่ไม่เคยถูก push ให้ใคร (ไม่มีแถวเลย) ยังพิมพ์ใช้ได้ทุกคนเหมือนเดิม
  const [walletRows] = await conn.execute('SELECT id FROM user_coupons WHERE promo_code_id = ? LIMIT 1', [
    promo.id,
  ]);
  let userCouponId = null;
  if (walletRows.length > 0) {
    if (!userId) throw httpError(401, 'กรุณาเข้าสู่ระบบก่อนใช้โค้ดนี้');
    const [mine] = await conn.execute(
      'SELECT id FROM user_coupons WHERE user_id = ? AND promo_code_id = ? AND is_used = FALSE',
      [userId, promo.id]
    );
    if (mine.length === 0) throw httpError(400, 'โค้ดนี้ไม่ได้อยู่ในกระเป๋าคูปองของคุณ');
    userCouponId = mine[0].id;
  }

  const raw =
    promo.discount_type === 'percent'
      ? (Number(subtotal) * Number(promo.discount_value)) / 100
      : Number(promo.discount_value);

  return { promo, discount: Math.min(raw, Number(subtotal)), userCouponId };
}

// ส่วนขยายจากเอกสาร: ให้หน้า cart ตรวจโค้ดจริงก่อนสั่งซื้อ (แทน mock ฝั่ง frontend)
async function validatePromo({ code, subtotal }, userId) {
  if (!isNonEmptyString(code)) throw httpError(400, 'กรุณาระบุโค้ดส่วนลด');
  const { promo, discount } = await checkPromo(pool, code.trim().toUpperCase(), subtotal || 0, userId);
  return {
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: Number(promo.discount_value),
    min_order_total: Number(promo.min_order_total),
    discount: Number(discount.toFixed(2)),
  };
}

// ── สร้างออเดอร์ (หัวใจของระบบ) ──
async function createOrder(userId, body) {
  const {
    items,
    shipping_name,
    shipping_phone,
    shipping_address,
    shipping_postal_code,
    promo_code,
    gift_wrap,
    gift_message,
  } = body;

  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'ไม่มีรายการสินค้าในคำสั่งซื้อ');
  }
  for (const it of items) {
    if (!isPositiveInt(it.variant_id) || !isPositiveInt(it.quantity)) {
      throw httpError(400, 'รายการสินค้าไม่ถูกต้อง');
    }
  }
  if (![shipping_name, shipping_phone, shipping_address, shipping_postal_code].every(isNonEmptyString)) {
    throw httpError(400, 'กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) ล็อกแถว variant (FOR UPDATE) กันสองคนซื้อพร้อมกัน แล้วตรวจสต็อก
    let subtotal = 0;
    const lines = [];
    for (const it of items) {
      const [rows] = await conn.execute(
        `SELECT v.id, v.price, v.cost_price, v.stock_qty, v.is_active, p.name
           FROM product_variants v
           JOIN products p ON p.id = v.product_id
          WHERE v.id = ? FOR UPDATE`,
        [it.variant_id]
      );
      if (rows.length === 0 || !rows[0].is_active) {
        throw httpError(400, `ไม่พบตัวเลือกสินค้า (id ${it.variant_id})`);
      }
      const v = rows[0];
      if (v.stock_qty < it.quantity) {
        throw httpError(400, `สินค้า "${v.name}" มีไม่พอ (เหลือ ${v.stock_qty} ชิ้น)`);
      }
      subtotal += Number(v.price) * Number(it.quantity);
      lines.push({
        variant_id: v.id,
        quantity: Number(it.quantity),
        unit_price: Number(v.price), // snapshot ราคา ณ วันซื้อ
        unit_cost: Number(v.cost_price), // snapshot ต้นทุน — รายงานกำไรแม่นแม้ต้นทุนเปลี่ยนทีหลัง
      });
    }

    // 2) ตรวจโค้ดส่วนลด (ถ้ามี) — คำนวณยอดฝั่ง server เท่านั้น ไม่เชื่อตัวเลขจาก client
    let discount = 0;
    let promoId = null;
    let userCouponId = null;
    if (promo_code) {
      const result = await checkPromo(conn, String(promo_code).trim().toUpperCase(), subtotal, userId);
      discount = result.discount;
      promoId = result.promo.id;
      userCouponId = result.userCouponId;
      await conn.execute('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [promoId]);
    }
    const total = subtotal - discount;

    // 3) บันทึกหัวออเดอร์ (ที่อยู่เก็บเป็น snapshot ณ วันสั่งซื้อ)
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, status, shipping_name, shipping_phone, shipping_address,
                           shipping_postal_code, subtotal, discount_amount, promo_code_id,
                           gift_wrap, gift_message, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        ORDER_STATUS.PENDING_PAYMENT,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_postal_code,
        subtotal,
        discount,
        promoId,
        gift_wrap ? 1 : 0,
        gift_wrap ? gift_message || null : null,
        total,
      ]
    );
    const orderId = orderResult.insertId;

    // 3.5) โค้ดนี้มาจากกระเป๋าคูปองของลูกค้า (ไม่ใช่โค้ด public) → ปิดสิทธิ์ใช้ซ้ำ
    if (userCouponId) {
      await conn.execute(
        'UPDATE user_coupons SET is_used = TRUE, used_order_id = ?, used_at = NOW() WHERE id = ?',
        [orderId, userCouponId]
      );
    }

    // 4) บันทึกรายการสินค้า + ตัดสต็อก (WHERE stock_qty >= ? กันตัดติดลบอีกชั้น)
    for (const line of lines) {
      await conn.execute(
        'INSERT INTO order_items (order_id, variant_id, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?)',
        [orderId, line.variant_id, line.quantity, line.unit_price, line.unit_cost]
      );
      const [upd] = await conn.execute(
        'UPDATE product_variants SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?',
        [line.quantity, line.variant_id, line.quantity]
      );
      if (upd.affectedRows === 0) {
        throw httpError(400, 'สต็อกสินค้าเปลี่ยนแปลงระหว่างสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
      }
    }

    // สำเร็จครบทุกขั้น → commit / ถ้าพลาดข้อใดข้อหนึ่ง catch ด้านล่างจะ rollback ทั้งหมด
    await conn.commit();

    // ใช้ชื่อจริงตามบัญชีที่สั่งซื้อ (ไม่ใช่ชื่อผู้รับปลายทางใน shipping_name — อาจเป็นคนละคนกันถ้าสั่งไปให้คนอื่น)
    const [[customer]] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);
    notifyStaff({
      type: NOTIFICATION_TYPE.NEW_ORDER,
      message: `${customer.full_name} สร้างคำสั่งซื้อใหม่ ${formatOrderCode(orderId)}`,
      order_id: orderId,
    });

    return {
      order_id: orderId,
      subtotal,
      discount,
      total_amount: total,
      status: ORDER_STATUS.PENDING_PAYMENT,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── ประวัติออเดอร์ของลูกค้า — shape ตรง contract ของ OrderHistoryPage ──
async function getMyOrders(userId) {
  const [orders] = await pool.execute(
    `SELECT id, status, created_at, total_amount, gift_wrap, gift_message, tracking_number, slip_image
       FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC`,
    [userId]
  );
  if (orders.length === 0) return [];

  const ids = orders.map((o) => o.id);
  const placeholders = ids.map(() => '?').join(',');

  const [items] = await pool.execute(
    `SELECT oi.order_id, oi.quantity AS qty, oi.unit_price, v.product_id, p.name,
            CONCAT_WS(' · ', v.size, v.color) AS variant_label,
            (SELECT pi.image_path FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image
       FROM order_items oi
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
      WHERE oi.order_id IN (${placeholders})`,
    ids
  );

  const [reviewed] = await pool.execute(
    `SELECT order_id, product_id FROM reviews WHERE user_id = ? AND order_id IN (${placeholders})`,
    [userId, ...ids]
  );

  return orders.map((o) => ({
    ...o,
    gift_wrap: Boolean(o.gift_wrap),
    total_amount: Number(o.total_amount),
    items: items
      .filter((it) => it.order_id === o.id)
      .map((it) => ({
        product_id: it.product_id,
        name: it.name,
        image: it.image,
        variant_label: it.variant_label,
        qty: it.qty,
        unit_price: Number(it.unit_price),
      })),
    reviewed_product_ids: reviewed.filter((r) => r.order_id === o.id).map((r) => r.product_id),
  }));
}

// ── แนบสลิปโอนเงิน (เจ้าของออเดอร์ + สถานะรอชำระเท่านั้น) ──
async function attachSlip(userId, orderId, filePath) {
  const [rows] = await pool.execute(
    `SELECT o.user_id, o.status, u.full_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.id = ?`,
    [orderId]
  );
  if (rows.length === 0) throw httpError(404, 'ไม่พบคำสั่งซื้อ');
  if (rows[0].user_id !== userId) throw httpError(403, 'ไม่ใช่คำสั่งซื้อของคุณ');
  if (rows[0].status !== ORDER_STATUS.PENDING_PAYMENT) {
    throw httpError(400, 'แนบสลิปได้เฉพาะคำสั่งซื้อที่รอชำระเงินเท่านั้น');
  }

  await pool.execute('UPDATE orders SET slip_image = ? WHERE id = ?', [filePath, orderId]);

  notifyStaff({
    type: NOTIFICATION_TYPE.SLIP_UPLOADED,
    message: `${rows[0].full_name} แนบสลิปโอนเงินสำหรับคำสั่งซื้อ ${formatOrderCode(orderId)}`,
    order_id: Number(orderId),
  });

  return { order_id: Number(orderId), slip_image: filePath };
}

// ── ยกเลิกออเดอร์ + คืนสต็อกใน transaction ──
async function cancelOrder(userId, orderId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute('SELECT user_id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (rows.length === 0) throw httpError(404, 'ไม่พบคำสั่งซื้อ');
    if (rows[0].user_id !== userId) throw httpError(403, 'ไม่ใช่คำสั่งซื้อของคุณ');
    if (rows[0].status !== ORDER_STATUS.PENDING_PAYMENT) {
      throw httpError(400, 'ยกเลิกได้เฉพาะคำสั่งซื้อที่ยังรอชำระเงิน — สถานะอื่นติดต่อร้านค้า');
    }

    // คืนสต็อกทุกรายการของออเดอร์นี้
    const [orderItems] = await conn.execute(
      'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );
    for (const it of orderItems) {
      await conn.execute('UPDATE product_variants SET stock_qty = stock_qty + ? WHERE id = ?', [
        it.quantity,
        it.variant_id,
      ]);
    }

    await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [ORDER_STATUS.CANCELLED, orderId]);
    await conn.commit();

    const [[customer]] = await pool.query('SELECT full_name FROM users WHERE id = ?', [userId]);
    notifyStaff({
      type: NOTIFICATION_TYPE.ORDER_CANCELLED,
      message: `${customer.full_name} ยกเลิกคำสั่งซื้อ ${formatOrderCode(orderId)}`,
      order_id: Number(orderId),
    });

    return { order_id: Number(orderId), status: ORDER_STATUS.CANCELLED };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { createOrder, getMyOrders, attachSlip, cancelOrder, validatePromo, notifyStaff, formatOrderCode };
