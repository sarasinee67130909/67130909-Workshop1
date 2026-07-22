// controllers/adminAuth.controller.js — รับ req → เรียก service → ส่ง response
const adminAuthService = require('../services/adminAuth.service');

async function forgotPassword(req, res, next) {
  try {
    const data = await adminAuthService.requestPasswordResetOtp(req.body.email);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await adminAuthService.resetPasswordWithOtp(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { forgotPassword, resetPassword };
