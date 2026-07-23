// utils/orderStatus.js — ค่าคงที่สถานะออเดอร์ (single source of truth — ตรงกับ ENUM ใน schema.sql)
const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment', // รอชำระเงิน/รอตรวจสลิป
  PAID: 'paid', // พนักงานยืนยันสลิปแล้ว
  PREPARING: 'preparing', // กำลังเตรียมสินค้า/ห่อของขวัญ
  SHIPPED: 'shipped', // จัดส่งแล้ว (มี tracking_number)
  DELIVERED: 'delivered', // ลูกค้าได้รับแล้ว (รีวิวได้)
  CANCELLED: 'cancelled', // ยกเลิก (คืนสต็อกแล้ว)
};

const ALL_STATUSES = Object.values(ORDER_STATUS);

module.exports = { ORDER_STATUS, ALL_STATUSES };
