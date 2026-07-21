// controllers/coupon.controller.js — รับ req → เรียก service → ส่ง response
const couponService = require('../services/coupon.service');

async function myCoupons(req, res, next) {
  try {
    const data = await couponService.listMyCoupons(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { myCoupons };
