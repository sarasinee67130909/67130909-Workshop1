// services/staff.service.js — logic ฝั่งพนักงาน: แดชบอร์ด / คำสั่งซื้อ / คลังสินค้า / จัดการสินค้า
// (SQL อยู่ชั้นนี้เท่านั้นตามกติกาข้อ 1 ของ PROJECT_STRUCTURE.md)
const pool = require('../config/db');
const { ORDER_STATUS, ALL_STATUSES } = require('../utils/orderStatus');
const { httpError, isPositiveInt, isNonEmptyString } = require('../utils/validators');
const stockService = require('./stock.service');

const ORDERS_PAGE_SIZE = 10;
const INVENTORY_PAGE_SIZE = 20; // นับที่ระดับ variant (SKU)
const PRODUCTS_PAGE_SIZE = 10;

// ลำดับสถานะที่ไปข้างหน้าได้ทีละขั้น (ยืนยันสลิปแยกเป็น endpoint ของตัวเอง)
const NEXT_STATUS = {
  paid: ORDER_STATUS.PREPARING,
  preparing: ORDER_STATUS.SHIPPED,
  shipped: ORDER_STATUS.DELIVERED,
};

// ============================================================
// Dashboard
// ============================================================
async function getDashboard() {
  const [[salesRow]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total_sales
       FROM orders WHERE status != 'cancelled'`
  );
  const [[pendingRow]] = await pool.query(
    `SELECT COUNT(*) AS pending_count FROM orders
      WHERE status IN ('pending_payment', 'paid', 'preparing')`
  );
  const [[newCustomersRow]] = await pool.query(
    `SELECT COUNT(*) AS new_customers FROM users
      WHERE role = 'customer' AND created_at >= (NOW() - INTERVAL 30 DAY)`
  );
  const outOfStock = await stockService.getOutOfStockCount();

  const [recentOrders] = await pool.query(
    `SELECT o.id, o.created_at, o.status, o.total_amount, u.full_name AS customer
       FROM orders o
       JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 5`
  );

  // สินค้าขายดี — นับจากออเดอร์ที่ไม่ถูกยกเลิก
  const [topProducts] = await pool.query(
    `SELECT p.id AS product_id, p.name, c.name AS category, MIN(v.sku) AS sku, SUM(oi.quantity) AS sold
       FROM order_items oi
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN categories c ON c.id = p.category_id
       JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
      GROUP BY p.id, p.name, c.name
      ORDER BY sold DESC
      LIMIT 5`
  );

  return {
    kpis: {
      total_sales: Number(salesRow.total_sales),
      pending_orders: pendingRow.pending_count,
      new_customers_30d: newCustomersRow.new_customers,
      out_of_stock_variants: outOfStock,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      customer: o.customer,
      created_at: o.created_at,
      total_amount: Number(o.total_amount),
      status: o.status,
    })),
    topProducts: topProducts.map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      sku: p.sku,
      sold: Number(p.sold),
    })),
  };
}

// ============================================================
// Orders
// ============================================================
async function getOrders({ status, search, page } = {}) {
  const where = [];
  const params = [];

  if (status) {
    if (!ALL_STATUSES.includes(status)) throw httpError(400, 'สถานะออเดอร์ไม่ถูกต้อง');
    where.push('o.status = ?');
    params.push(status);
  }
  if (search) {
    const term = `%${search.trim()}%`;
    if (/^\d+$/.test(search.trim())) {
      where.push('o.id = ?');
      params.push(Number(search.trim()));
    } else {
      where.push('(u.full_name LIKE ? OR u.email LIKE ?)');
      params.push(term, term);
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id ${whereSql}`,
    params
  );
  const total = countRows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const offset = (currentPage - 1) * ORDERS_PAGE_SIZE;

  const [rows] = await pool.query(
    `SELECT o.id, o.created_at, o.status, o.total_amount, o.slip_image,
            u.full_name AS customer, u.email AS customer_email,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${whereSql}
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ${ORDERS_PAGE_SIZE} OFFSET ${offset}`,
    params
  );

  return {
    items: rows.map((o) => ({
      id: o.id,
      customer: o.customer,
      customer_email: o.customer_email,
      created_at: o.created_at,
      total_amount: Number(o.total_amount),
      status: o.status,
      has_slip: Boolean(o.slip_image),
      item_count: o.item_count,
    })),
    total,
    page: currentPage,
    totalPages,
    pageSize: ORDERS_PAGE_SIZE,
  };
}

async function getOrderById(orderId) {
  const [orders] = await pool.execute(
    `SELECT o.*, u.full_name AS customer, u.email AS customer_email, u.phone AS customer_phone
       FROM orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.id = ?`,
    [orderId]
  );
  if (orders.length === 0) throw httpError(404, 'ไม่พบคำสั่งซื้อนี้');
  const o = orders[0];

  const [items] = await pool.execute(
    `SELECT oi.quantity, oi.unit_price, v.sku, v.size, v.color, v.material, p.id AS product_id, p.name
       FROM order_items oi
       JOIN product_variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
      WHERE oi.order_id = ?`,
    [orderId]
  );

  return {
    id: o.id,
    status: o.status,
    customer: o.customer,
    customer_email: o.customer_email,
    customer_phone: o.customer_phone,
    shipping_name: o.shipping_name,
    shipping_phone: o.shipping_phone,
    shipping_address: o.shipping_address,
    shipping_postal_code: o.shipping_postal_code,
    subtotal: Number(o.subtotal),
    discount_amount: Number(o.discount_amount),
    total_amount: Number(o.total_amount),
    gift_wrap: Boolean(o.gift_wrap),
    gift_message: o.gift_message,
    slip_image: o.slip_image,
    tracking_number: o.tracking_number,
    paid_at: o.paid_at,
    created_at: o.created_at,
    items: items.map((it) => ({
      product_id: it.product_id,
      name: it.name,
      sku: it.sku,
      variant_label: [it.size, it.color, it.material].filter(Boolean).join(' · '),
      qty: it.quantity,
      unit_price: Number(it.unit_price),
    })),
  };
}

// ยืนยันสลิปโอนเงิน: pending_payment → paid (ต้องมีสลิปแนบมาก่อน)
async function verifyPayment(orderId) {
  const [rows] = await pool.execute('SELECT status, slip_image FROM orders WHERE id = ?', [orderId]);
  if (rows.length === 0) throw httpError(404, 'ไม่พบคำสั่งซื้อนี้');
  if (rows[0].status !== ORDER_STATUS.PENDING_PAYMENT) {
    throw httpError(400, 'ยืนยันการชำระเงินได้เฉพาะออเดอร์ที่สถานะรอชำระเงินเท่านั้น');
  }
  if (!rows[0].slip_image) throw httpError(400, 'ออเดอร์นี้ยังไม่ได้แนบสลิปโอนเงิน');

  await pool.execute('UPDATE orders SET status = ?, paid_at = NOW() WHERE id = ?', [
    ORDER_STATUS.PAID,
    orderId,
  ]);
  return { order_id: Number(orderId), status: ORDER_STATUS.PAID };
}

// เดินสถานะไปข้างหน้าทีละขั้น: paid → preparing → shipped (ต้องมี tracking_number) → delivered
async function updateOrderStatus(orderId, { status, tracking_number }) {
  if (!ALL_STATUSES.includes(status)) throw httpError(400, 'สถานะออเดอร์ไม่ถูกต้อง');

  const [rows] = await pool.execute('SELECT status FROM orders WHERE id = ?', [orderId]);
  if (rows.length === 0) throw httpError(404, 'ไม่พบคำสั่งซื้อนี้');
  const current = rows[0].status;

  if (NEXT_STATUS[current] !== status) {
    throw httpError(
      400,
      `เปลี่ยนสถานะจาก "${current}" เป็น "${status}" โดยตรงไม่ได้ ต้องเป็นไปตามลำดับ paid → preparing → shipped → delivered`
    );
  }
  if (status === ORDER_STATUS.SHIPPED && !isNonEmptyString(tracking_number)) {
    throw httpError(400, 'กรุณากรอกเลขพัสดุก่อนเปลี่ยนเป็นสถานะจัดส่งแล้ว');
  }

  if (status === ORDER_STATUS.SHIPPED) {
    await pool.execute('UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?', [
      status,
      tracking_number.trim(),
      orderId,
    ]);
  } else {
    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  }
  return { order_id: Number(orderId), status };
}

// ยกเลิกออเดอร์โดยพนักงาน + คืนสต็อก (ยกเลิกได้ตราบใดที่ยังไม่จัดส่ง/ส่งถึงแล้ว)
async function cancelOrder(orderId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute('SELECT status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (rows.length === 0) throw httpError(404, 'ไม่พบคำสั่งซื้อนี้');
    const current = rows[0].status;
    if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAID, ORDER_STATUS.PREPARING].includes(current)) {
      throw httpError(400, 'ยกเลิกได้เฉพาะออเดอร์ที่ยังไม่ถูกจัดส่งเท่านั้น');
    }

    await stockService.restoreOrderStock(conn, orderId);
    await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [ORDER_STATUS.CANCELLED, orderId]);

    await conn.commit();
    return { order_id: Number(orderId), status: ORDER_STATUS.CANCELLED };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ============================================================
// Inventory
// ============================================================
async function getInventory({ search, lowStockOnly, page } = {}) {
  const where = ['v.is_active = TRUE'];
  const params = [];

  if (search) {
    where.push('(p.name LIKE ? OR v.sku LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (lowStockOnly === 'true' || lowStockOnly === true) {
    where.push('v.stock_qty <= v.low_stock_threshold');
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM product_variants v JOIN products p ON p.id = v.product_id ${whereSql}`,
    params
  );
  const total = countRows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const offset = (currentPage - 1) * INVENTORY_PAGE_SIZE;

  const [rows] = await pool.query(
    `SELECT v.id, v.sku, v.size, v.color, v.material, v.price, v.stock_qty, v.low_stock_threshold,
            p.id AS product_id, p.name AS product_name,
            (SELECT pi.image_path FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       ${whereSql}
      ORDER BY p.name ASC, v.id ASC
      LIMIT ${INVENTORY_PAGE_SIZE} OFFSET ${offset}`,
    params
  );

  // จัดกลุ่มตามสินค้า (collection) สำหรับแถวหัวกลุ่มในตาราง — กลุ่มอาจถูกตัดคาบเกี่ยวหน้าได้ตามธรรมชาติของการแบ่งหน้า
  const collections = [];
  const byProduct = new Map();
  for (const v of rows) {
    let group = byProduct.get(v.product_id);
    if (!group) {
      group = { product_id: v.product_id, name: v.product_name, variants: [] };
      byProduct.set(v.product_id, group);
      collections.push(group);
    }
    group.variants.push({
      id: v.id,
      sku: v.sku,
      name: v.product_name,
      size: v.size,
      color: v.color,
      material: v.material,
      price: Number(v.price),
      stock: v.stock_qty,
      low_stock_threshold: v.low_stock_threshold,
      hasImage: Boolean(v.image),
      image: v.image,
    });
  }

  const [[skuTotalRow]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM product_variants WHERE is_active = TRUE'
  );
  const lowStockAlerts = await stockService.getLowStockCount();
  const outOfStock = await stockService.getOutOfStockCount();
  const [[valueRow]] = await pool.query(
    'SELECT COALESCE(SUM(stock_qty * price), 0) AS total_value FROM product_variants WHERE is_active = TRUE'
  );

  return {
    collections,
    total,
    page: currentPage,
    totalPages,
    pageSize: INVENTORY_PAGE_SIZE,
    kpis: {
      total_skus: skuTotalRow.cnt,
      low_stock_alerts: lowStockAlerts,
      total_stock_value: Number(valueRow.total_value),
      out_of_stock: outOfStock,
    },
  };
}

async function adjustVariantStock(variantId, { stock_qty, delta }) {
  if (stock_qty !== undefined) return stockService.setStock(variantId, stock_qty);
  if (delta !== undefined) return stockService.adjustStock(variantId, Number(delta));
  throw httpError(400, 'กรุณาระบุ stock_qty หรือ delta');
}

// ============================================================
// Products (สร้าง/แก้ไขสินค้า + ตัวเลือกสินค้า)
// ============================================================
async function getCategories() {
  const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY id ASC');
  return rows;
}

async function getStaffProducts({ search, category, page } = {}) {
  const where = [];
  const params = [];
  if (search) {
    where.push('p.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (category) {
    where.push('p.category_id = ?');
    params.push(Number(category));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
    params
  );
  const total = countRows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const offset = (currentPage - 1) * PRODUCTS_PAGE_SIZE;

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.is_visible, c.name AS category,
            (SELECT pi.image_path FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image,
            (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = TRUE) AS min_price,
            (SELECT SUM(v.stock_qty) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = TRUE) AS total_stock
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereSql}
      ORDER BY p.id DESC
      LIMIT ${PRODUCTS_PAGE_SIZE} OFFSET ${offset}`,
    params
  );

  return {
    items: rows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      is_visible: Boolean(p.is_visible),
      image: p.image,
      min_price: p.min_price !== null ? Number(p.min_price) : null,
      total_stock: p.total_stock !== null ? Number(p.total_stock) : 0,
    })),
    total,
    page: currentPage,
    totalPages,
    pageSize: PRODUCTS_PAGE_SIZE,
  };
}

// รายละเอียดสินค้าสำหรับหน้าแก้ไข (staff เห็นได้ทุกสถานะ ทั้งซ่อน/ปิดขาย)
async function getStaffProductById(id) {
  const [products] = await pool.execute(
    `SELECT p.id, p.name, p.description, p.is_visible, p.category_id, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?`,
    [id]
  );
  if (products.length === 0) throw httpError(404, 'ไม่พบสินค้านี้');
  const p = products[0];

  const [images] = await pool.execute(
    'SELECT id, image_path, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
    [id]
  );
  const [variants] = await pool.execute(
    `SELECT id, sku, size, color, material, price, cost_price, stock_qty, low_stock_threshold, is_active
       FROM product_variants WHERE product_id = ? ORDER BY id ASC`,
    [id]
  );

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    is_visible: Boolean(p.is_visible),
    category_id: p.category_id,
    category_name: p.category_name,
    images: images.map((im) => ({ id: im.id, path: im.image_path, is_primary: Boolean(im.is_primary) })),
    variants: variants.map((v) => ({
      ...v,
      price: Number(v.price),
      cost_price: Number(v.cost_price),
      is_active: Boolean(v.is_active),
    })),
  };
}

// รีวิวของสินค้าชิ้นนี้ — ให้ staff เปิดดูตอนคลิกแจ้งเตือน "ลูกค้ารีวิว" (รูปแบบข้อมูลเดียวกับที่ลูกค้าเห็นในหน้าสินค้า)
async function getProductReviews(productId) {
  const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [productId]);
  if (products.length === 0) throw httpError(404, 'ไม่พบสินค้านี้');

  const [reviews] = await pool.execute(
    `SELECT r.id, u.full_name AS user_name, r.rating, r.comment,
            DATE_FORMAT(r.created_at, '%d/%m/%Y') AS created_at
       FROM reviews r
       JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC`,
    [productId]
  );
  return reviews;
}

// รีวิวใบเดียว (เต็มรายละเอียด) — ใช้เปิดเป็นป๊อปอัพตอน staff คลิกแจ้งเตือน "ลูกค้ารีวิว"
async function getReviewById(id) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.product_id, p.name AS product_name, u.full_name AS user_name, r.rating, r.comment,
            DATE_FORMAT(r.created_at, '%d/%m/%Y') AS created_at
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
      WHERE r.id = ?`,
    [id]
  );
  if (rows.length === 0) throw httpError(404, 'ไม่พบรีวิวนี้');
  return rows[0];
}

// ตรวจข้อมูล variant ที่ส่งมาจากฟอร์ม (ใช้ทั้งตอนสร้างและแก้ไข)
function validateVariantInput(v) {
  if (!isNonEmptyString(v.sku)) throw httpError(400, 'กรุณาระบุ SKU ให้ครบทุกตัวเลือกสินค้า');
  if (v.price === undefined || Number(v.price) <= 0) throw httpError(400, `ราคาของ SKU "${v.sku}" ต้องมากกว่า 0`);
  if (v.stock_qty === undefined || !Number.isInteger(Number(v.stock_qty)) || Number(v.stock_qty) < 0) {
    throw httpError(400, `จำนวนสต็อกเริ่มต้นของ SKU "${v.sku}" ต้องเป็นจำนวนเต็มไม่ติดลบ`);
  }
}

// สร้างสินค้าใหม่พร้อมตัวเลือกสินค้าอย่างน้อย 1 รายการ — อยู่ใน transaction เดียว
async function createProduct(body) {
  const { name, description, category_id, is_visible, variants } = body;

  if (!isNonEmptyString(name)) throw httpError(400, 'กรุณากรอกชื่อสินค้า');
  if (!isPositiveInt(category_id)) throw httpError(400, 'กรุณาเลือกหมวดหมู่สินค้า');
  if (!Array.isArray(variants) || variants.length === 0) {
    throw httpError(400, 'สินค้าต้องมีตัวเลือกอย่างน้อย 1 รายการ (ไซซ์/สี/วัสดุ)');
  }
  variants.forEach(validateVariantInput);

  const [catRows] = await pool.execute('SELECT id FROM categories WHERE id = ?', [category_id]);
  if (catRows.length === 0) throw httpError(400, 'ไม่พบหมวดหมู่สินค้านี้');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [productResult] = await conn.execute(
      'INSERT INTO products (category_id, name, description, is_visible) VALUES (?, ?, ?, ?)',
      [category_id, name.trim(), description || null, is_visible === false ? 0 : 1]
    );
    const productId = productResult.insertId;

    for (const v of variants) {
      await conn.execute(
        `INSERT INTO product_variants
           (product_id, sku, size, color, material, price, cost_price, stock_qty, low_stock_threshold, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          productId,
          v.sku.trim(),
          v.size || null,
          v.color || null,
          v.material || null,
          Number(v.price),
          Number(v.cost_price) || 0,
          Number(v.stock_qty),
          Number(v.low_stock_threshold) || 5,
        ]
      );
    }

    await conn.commit();
    return { id: productId };
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') throw httpError(400, 'มี SKU นี้อยู่ในระบบแล้ว กรุณาใช้ SKU อื่น');
    throw err;
  } finally {
    conn.release();
  }
}

// แก้ไขสินค้าเดิม: อัปเดตข้อมูลหลัก + upsert ตัวเลือกสินค้า (มี id = แก้ไข, ไม่มี id = เพิ่มใหม่)
// ตัวเลือกเดิมที่ไม่ได้ส่งมาด้วย จะถูกปิดใช้งาน (is_active = FALSE) แทนการลบ เพื่อไม่ให้กระทบประวัติออเดอร์เก่า
async function updateProduct(id, body) {
  const { name, description, category_id, is_visible, variants } = body;

  const [existing] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
  if (existing.length === 0) throw httpError(404, 'ไม่พบสินค้านี้');

  if (!isNonEmptyString(name)) throw httpError(400, 'กรุณากรอกชื่อสินค้า');
  if (!isPositiveInt(category_id)) throw httpError(400, 'กรุณาเลือกหมวดหมู่สินค้า');
  if (!Array.isArray(variants) || variants.length === 0) {
    throw httpError(400, 'สินค้าต้องมีตัวเลือกอย่างน้อย 1 รายการ (ไซซ์/สี/วัสดุ)');
  }
  variants.forEach(validateVariantInput);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      'UPDATE products SET category_id = ?, name = ?, description = ?, is_visible = ? WHERE id = ?',
      [category_id, name.trim(), description || null, is_visible === false ? 0 : 1, id]
    );

    const [currentVariants] = await conn.execute('SELECT id FROM product_variants WHERE product_id = ?', [id]);
    const currentIds = currentVariants.map((v) => v.id);
    const keptIds = [];

    for (const v of variants) {
      if (v.id && currentIds.includes(Number(v.id))) {
        await conn.execute(
          `UPDATE product_variants
              SET sku = ?, size = ?, color = ?, material = ?, price = ?, cost_price = ?,
                  low_stock_threshold = ?, is_active = TRUE
            WHERE id = ? AND product_id = ?`,
          [
            v.sku.trim(),
            v.size || null,
            v.color || null,
            v.material || null,
            Number(v.price),
            Number(v.cost_price) || 0,
            Number(v.low_stock_threshold) || 5,
            v.id,
            id,
          ]
        );
        keptIds.push(Number(v.id));
      } else {
        const [inserted] = await conn.execute(
          `INSERT INTO product_variants
             (product_id, sku, size, color, material, price, cost_price, stock_qty, low_stock_threshold, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            id,
            v.sku.trim(),
            v.size || null,
            v.color || null,
            v.material || null,
            Number(v.price),
            Number(v.cost_price) || 0,
            Number(v.stock_qty),
            Number(v.low_stock_threshold) || 5,
          ]
        );
        keptIds.push(inserted.insertId);
      }
    }

    // ปิดใช้งานตัวเลือกเก่าที่ไม่ได้ส่งมาในฟอร์มอีกต่อไป (ไม่ลบ เพื่อรักษาประวัติ order_items)
    const removedIds = currentIds.filter((cid) => !keptIds.includes(cid));
    if (removedIds.length > 0) {
      const placeholders = removedIds.map(() => '?').join(',');
      await conn.execute(
        `UPDATE product_variants SET is_active = FALSE WHERE id IN (${placeholders})`,
        removedIds
      );
    }

    await conn.commit();
    return { id: Number(id) };
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') throw httpError(400, 'มี SKU นี้อยู่ในระบบแล้ว กรุณาใช้ SKU อื่น');
    throw err;
  } finally {
    conn.release();
  }
}

// แนบรูปภาพสินค้า (อัปโหลดผ่าน multer แล้วเก็บ path ที่นี่)
async function addProductImage(productId, imagePath, isPrimary) {
  const [prod] = await pool.execute('SELECT id FROM products WHERE id = ?', [productId]);
  if (prod.length === 0) throw httpError(404, 'ไม่พบสินค้านี้');

  if (isPrimary) {
    await pool.execute('UPDATE product_images SET is_primary = FALSE WHERE product_id = ?', [productId]);
  }
  const [result] = await pool.execute(
    'INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, 0)',
    [productId, imagePath, isPrimary ? 1 : 0]
  );
  return { id: result.insertId, product_id: Number(productId), image_path: imagePath };
}

module.exports = {
  getDashboard,
  getOrders,
  getOrderById,
  verifyPayment,
  updateOrderStatus,
  cancelOrder,
  getInventory,
  adjustVariantStock,
  getCategories,
  getStaffProducts,
  getStaffProductById,
  createProduct,
  updateProduct,
  addProductImage,
  getProductReviews,
  getReviewById,
};