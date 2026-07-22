// routes/staffAuth.routes.js — /api/staff-auth/* ลืมรหัสผ่านฝั่ง Staff (OTP ทางอีเมลจริง)
// เป็น route สาธารณะ (ไม่ผ่าน verifyToken) เพราะยังไม่ได้ล็อกอิน — แยก namespace จาก /api/staff
// ที่ต้องผ่าน verifyToken + requireRole('staff','admin') ทั้งหมด กันชนกับ middleware กลุ่มนั้น
const router = require('express').Router();
const staffAuthController = require('../controllers/staffAuth.controller');

router.post('/forgot-password', staffAuthController.forgotPassword);
router.post('/reset-password', staffAuthController.resetPassword);

module.exports = router;
