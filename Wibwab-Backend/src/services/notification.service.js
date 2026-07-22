// services/notification.service.js — กระดิ่งแจ้งเตือน staff/admin (inbox กลาง ไม่ผูกกับ staff คนใดคนหนึ่ง)
const pool = require('../config/db');
const { httpError } = require('../utils/validators');

const LIST_LIMIT = 20;

// เรียกจาก order.service.js / review.service.js ตอนลูกค้าทำรายการ — ไม่ throw ให้ caller เพื่อไม่ให้
// การแจ้งเตือนพลาดจนกระทบ flow หลัก (สร้างออเดอร์/แนบสลิป/รีวิว) — ผู้เรียกต้อง .catch เอง
async function createNotification({ type, message, order_id }) {
  await pool.execute('INSERT INTO notifications (type, message, order_id) VALUES (?, ?, ?)', [
    type,
    message,
    order_id || null,
  ]);
}

async function listNotifications() {
  const [rows] = await pool.query(
    `SELECT id, type, message, order_id, is_read, created_at
       FROM notifications
      ORDER BY created_at DESC, id DESC
      LIMIT ${LIST_LIMIT}`
  );
  const [[{ unread_count }]] = await pool.query(
    'SELECT COUNT(*) AS unread_count FROM notifications WHERE is_read = FALSE'
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

async function markAllRead() {
  await pool.execute('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
  return { message: 'อ่านการแจ้งเตือนทั้งหมดแล้ว' };
}

module.exports = { createNotification, listNotifications, markRead, markAllRead };
