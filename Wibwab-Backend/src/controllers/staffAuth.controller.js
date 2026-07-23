// controllers/staffAuth.controller.js — รับ req → เรียก service → ส่ง response
const staffAuthService = require('../services/staffAuth.service');

async function forgotPassword(req, res, next) {
  try {
    const data = await staffAuthService.requestPasswordResetOtp(req.body.email);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await staffAuthService.resetPasswordWithOtp(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { forgotPassword, resetPassword };
