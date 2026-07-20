// controllers/auth.controller.js — รับ req → เรียก service → ส่ง response
const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const data = await authService.getMe(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const data = await authService.logout(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const data = await authService.forgotPassword(req.body.email);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const data = await authService.changePassword(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};