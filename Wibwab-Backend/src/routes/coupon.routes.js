// routes/coupon.routes.js — /api/coupons/* กระเป๋าคูปองของลูกค้าที่ล็อกอินอยู่
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const couponController = require('../controllers/coupon.controller');

router.get('/my', verifyToken, couponController.myCoupons);

module.exports = router;
