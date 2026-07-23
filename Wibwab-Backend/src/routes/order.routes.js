// routes/order.routes.js — POST /api/orders, GET /my, แนบสลิป, ยกเลิก, ตรวจโค้ดส่วนลด
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { uploadSlip } = require('../middleware/upload');
const orderController = require('../controllers/order.controller');

router.post('/', verifyToken, orderController.create);
router.get('/my', verifyToken, orderController.myOrders);
router.post('/:id/slip', verifyToken, uploadSlip.single('slip'), orderController.uploadSlip);
router.put('/:id/cancel', verifyToken, orderController.cancel);

// ส่วนขยายจากเอกสาร: ให้หน้า cart ตรวจโค้ดส่วนลดจริงก่อนสั่งซื้อ (ไม่ต้องล็อกอินก็เช็คได้)
router.post('/validate-promo', orderController.validatePromo);

module.exports = router;
