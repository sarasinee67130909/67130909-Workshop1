// routes/review.routes.js — POST /api/reviews (เฉพาะคนที่ซื้อจริงและได้รับสินค้าแล้ว)
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const reviewController = require('../controllers/review.controller');

router.post('/', verifyToken, reviewController.create);

module.exports = router;
