// utils/notificationType.js — ค่าคงที่ประเภทการแจ้งเตือน (single source of truth — ตรงกับ ENUM ใน schema.sql)
const NOTIFICATION_TYPE = {
  NEW_ORDER: 'new_order', // ลูกค้าสร้างคำสั่งซื้อใหม่
  SLIP_UPLOADED: 'slip_uploaded', // ลูกค้าแนบสลิปโอนเงิน
  ORDER_CANCELLED: 'order_cancelled', // ลูกค้ายกเลิกคำสั่งซื้อ
  NEW_REVIEW: 'new_review', // ลูกค้าเขียนรีวิวสินค้า
  LOW_STOCK: 'low_stock', // สต็อกตัวเลือกสินค้าลดลงถึง/ต่ำกว่า low_stock_threshold
  ORDER_OVERDUE: 'order_overdue', // ออเดอร์ค้างสถานะ pending_payment เกิน 24 ชม.
};

// ประเภทที่ staff เห็น (แจ้งเตือนระดับรายการ — ต่อออเดอร์/รีวิวแต่ละอัน)
const STAFF_NOTIFICATION_TYPES = [
  NOTIFICATION_TYPE.NEW_ORDER,
  NOTIFICATION_TYPE.SLIP_UPLOADED,
  NOTIFICATION_TYPE.ORDER_CANCELLED,
  NOTIFICATION_TYPE.NEW_REVIEW,
];

// ประเภทที่ admin เห็น (แจ้งเตือนระดับบริหาร/ภาพรวม — ไม่เอาแจ้งเตือนรายออเดอร์แบบ staff มาปนกันให้เป็น noise)
const ADMIN_NOTIFICATION_TYPES = [NOTIFICATION_TYPE.LOW_STOCK, NOTIFICATION_TYPE.ORDER_OVERDUE];

module.exports = { NOTIFICATION_TYPE, STAFF_NOTIFICATION_TYPES, ADMIN_NOTIFICATION_TYPES };
