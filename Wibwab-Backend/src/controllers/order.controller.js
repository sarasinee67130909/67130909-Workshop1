// controllers/order.controller.js — รับ req → เรียก service → ส่ง response
const jwt = require('jsonwebtoken');
const orderService = require('../services/order.service');
const { httpError } = require('../utils/validators');

// validate-promo เป็น public route (ไม่มี verifyToken) แต่ถ้ามี token แนบมาก็อยากรู้ตัวลูกค้า
// เพื่อเช็คสิทธิ์คูปองที่อยู่ในกระเป๋า — ถอดแบบ "เผื่อมี" เท่านั้น ผิดพลาด/ไม่มี token ก็ถือว่าไม่ล็อกอิน
function getOptionalUserId(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
}

async function create(req, res, next) {
  try {
    const data = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function myOrders(req, res, next) {
  try {
    const data = await orderService.getMyOrders(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function uploadSlip(req, res, next) {
  try {
    if (!req.file) throw httpError(400, 'กรุณาแนบไฟล์สลิปโอนเงิน');
    const filePath = `/uploads/slips/${req.file.filename}`;
    const data = await orderService.attachSlip(req.user.id, req.params.id, filePath);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const data = await orderService.cancelOrder(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function validatePromo(req, res, next) {
  try {
    const data = await orderService.validatePromo(req.body, getOptionalUserId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, myOrders, uploadSlip, cancel, validatePromo };
