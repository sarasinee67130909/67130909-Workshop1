// services/notification.service.js — กระดิ่งแจ้งเตือน staff/admin (inbox กลาง ไม่ผูกกับใครคนใดคนหนึ่ง)
// staff กับ admin ใช้ตาราง/service ชุดเดียวกัน ต่างกันแค่ "ประเภท" ที่แต่ละฝั่งดึงมาแสดง (ดู utils/notificationType.js)
const pool = require('../config/db');
const { NOTIFICATION_TYPE } = require('../utils/notificationType');
const { httpError } = require('../utils/validators');

const LIST_LIMIT = 20;
const OVERDUE_HOURS = 24;

// เรียกจาก order.service.js / review.service.js / stock.service.js ตอนลูกค้า/ระบบทำรายการ — ไม่ throw ให้ caller
// เพื่อไม่ให้การแจ้งเตือนพลาดจนกระทบ flow หลัก — ผู้เรียกต้อง .catch เอง
async function createNotification({ type, message, order_id, variant_id, product_id, review_id }) {
  await pool.execute(
    'INSERT INTO notifications (type, message, order_id, variant_id, product_id, review_id) VALUES (?, ?, ?, ?, ?, ?)',
    [type, message, order_id || null, variant_id || null, product_id || null, review_id || null]
  );
}

// ── แจ้งเตือนสต็อกใกล้หมด (เรียกจาก stock.service.js ตอนปรับสต็อก) ──
// กันแจ้งซ้ำ: ถ้ามีแจ้งเตือน low_stock ของ variant นี้ที่ยังไม่ถูกอ่านอยู่แล้ว ไม่ต้องสร้างซ้ำ
// (แจ้งใหม่อีกครั้งได้ต่อเมื่อ admin กดอ่านอันเดิมแล้ว หรือสต็อกฟื้นเกิน threshold แล้วลดลงมาอีกรอบ)
async function notifyLowStock({ variantId, productName, sku, stockQty }) {
  const [existing] = await pool.execute(
    'SELECT id FROM notifications WHERE type = ? AND variant_id = ? AND is_read = FALSE LIMIT 1',
    [NOTIFICATION_TYPE.LOW_STOCK, variantId]
  );
  if (existing.length > 0) return; // ยังไม่ถูกจัดการ ไม่ต้องแจ้งซ้ำ

  const message =
    stockQty > 0
      ? `สินค้า "${productName}" (${sku}) ใกล้หมด เหลือ ${stockQty} ชิ้น`
      : `สินค้า "${productName}" (${sku}) หมดสต็อกแล้ว`;

  await createNotification({ type: NOTIFICATION_TYPE.LOW_STOCK, message, variant_id: variantId });
}

// ── กวาดหาออเดอร์ที่ค้างสถานะ pending_payment เกิน 24 ชม. แล้วสร้างแจ้งเตือน (ยังไม่เคยแจ้ง) ──
// เรียกตอน admin เปิดหน้าแจ้งเตือน (ตรวจตอนเรียกใช้ ไม่มี background job แยก — ตามที่ตกลงกันไว้)
async function sweepOverdueOrders() {
  const [rows] = await pool.query(
    `SELECT o.id, o.shipping_name
       FROM orders o
      WHERE o.status = 'pending_payment'
        AND o.created_at < (NOW() - INTERVAL ${OVERDUE_HOURS} HOUR)
        AND NOT EXISTS (
          SELECT 1 FROM notifications n WHERE n.type = ? AND n.order_id = o.id
        )`,
    [NOTIFICATION_TYPE.ORDER_OVERDUE]
  );

  for (const order of rows) {
    await createNotification({
      type: NOTIFICATION_TYPE.ORDER_OVERDUE,
      message: `คำสั่งซื้อ #ORD-${String(order.id).padStart(4, '0')} (${order.shipping_name}) ค้างชำระเงินเกิน ${OVERDUE_HOURS} ชม.`,
      order_id: order.id,
    });
  }
}

async function listNotifications(types) {
  const placeholders = types.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, type, message, order_id, variant_id, product_id, review_id, is_read, created_at
       FROM notifications
      WHERE type IN (${placeholders})
      ORDER BY created_at DESC, id DESC
      LIMIT ${LIST_LIMIT}`,
    types
  );
  const [[{ unread_count }]] = await pool.query(
    `SELECT COUNT(*) AS unread_count FROM notifications WHERE is_read = FALSE AND type IN (${placeholders})`,
    types
  );

  return {
    items: rows.map((r) => ({ ...r, is_read: Boolean(r.is_read) })),
    unread_count,
  };
}

async function markRead(id) {
  const [result] = await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw httpError(404, 'ไม่พบการแจ้งเตือนนี้');
  return { id: Number(id) };
}

async function markAllRead(types) {
  const placeholders = types.map(() => '?').join(',');
  await pool.execute(
    `UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE AND type IN (${placeholders})`,
    types
  );
  return { message: 'อ่านการแจ้งเตือนทั้งหมดแล้ว' };
}

async function deleteNotification(id) {
  const [result] = await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw httpError(404, 'ไม่พบการแจ้งเตือนนี้');
  return { id: Number(id) };
}

module.exports = {
  createNotification,
  notifyLowStock,
  sweepOverdueOrders,
  listNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
