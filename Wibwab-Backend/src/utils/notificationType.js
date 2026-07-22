// utils/notificationType.js — ค่าคงที่ประเภทการแจ้งเตือน (single source of truth — ตรงกับ ENUM ใน schema.sql)
const NOTIFICATION_TYPE = {
  NEW_ORDER: 'new_order', // ลูกค้าสร้างคำสั่งซื้อใหม่
  SLIP_UPLOADED: 'slip_uploaded', // ลูกค้าแนบสลิปโอนเงิน
  ORDER_CANCELLED: 'order_cancelled', // ลูกค้ายกเลิกคำสั่งซื้อ
  NEW_REVIEW: 'new_review', // ลูกค้าเขียนรีวิวสินค้า
};

module.exports = { NOTIFICATION_TYPE };
