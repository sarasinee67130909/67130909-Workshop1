// utils/couponType.js — ค่าคงที่ push_trigger ของโค้ดส่วนลด (single source of truth — ตรงกับ ENUM ใน schema.sql)
const PUSH_TRIGGER = {
  MANUAL: 'manual', // staff ต้องกด Push เอง
  ON_REGISTER: 'on_register', // แจกอัตโนมัติทุกครั้งที่มีสมาชิกใหม่ (Welcome Coupon)
};

const ALL_PUSH_TRIGGERS = Object.values(PUSH_TRIGGER);

module.exports = { PUSH_TRIGGER, ALL_PUSH_TRIGGERS };
