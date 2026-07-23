// routes/adminAuth.routes.js — /api/admin-auth/* ลืมรหัสผ่านฝั่ง Admin (OTP ทางอีเมลจริง)
// เป็น route สาธารณะ (ไม่ผ่าน verifyToken) เพราะยังไม่ได้ล็อกอิน — แยก namespace จาก /api/admin
// ที่ต้องผ่าน verifyToken + requireRole('admin') ทั้งหมด กันชนกับ middleware กลุ่มนั้น
const router = require('express').Router();
const adminAuthController = require('../controllers/adminAuth.controller');

router.post('/forgot-password', adminAuthController.forgotPassword);
router.post('/reset-password', adminAuthController.resetPassword);

module.exports = router;
