// src/app.js — สร้าง express app, ติดตั้ง middleware กลาง, ผูก routes
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const addressRoutes = require('./routes/address.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// เปิดให้เข้าถึงรูปสินค้า/สลิปที่อัปโหลดผ่าน URL /uploads/...
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/favorites', favoriteRoutes);

// TODO(Dev2): mount routes ฝั่งพนักงาน/แอดมินตรงนี้เมื่อพร้อม
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// หมายเหตุ: ไม่มี cart routes โดยดีไซน์ — ตะกร้าเก็บฝั่ง client (localStorage) ตาม §3

// path ที่ไม่มีจริง → 404 format เดียวกัน
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'ไม่พบ endpoint นี้' });
});

// error handler กลาง — ต้องอยู่ท้ายสุดเสมอ
app.use(errorHandler);

module.exports = app;
