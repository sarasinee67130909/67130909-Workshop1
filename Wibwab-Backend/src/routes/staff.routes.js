// routes/staff.routes.js — /api/staff/* จัดการออเดอร์ สต็อก สินค้า
// ทุก route ผ่าน verifyToken + requireRole('staff','admin') ตามกติกาข้อ 5
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { uploadProductImage } = require('../middleware/upload');
const staffController = require('../controllers/staff.controller');

router.use(verifyToken, requireRole('staff', 'admin'));

// ── Dashboard ──
router.get('/dashboard', staffController.dashboard);

// ── Orders ──
router.get('/orders', staffController.listOrders);
router.get('/orders/:id', staffController.getOrder);
router.put('/orders/:id/verify-payment', staffController.verifyOrderPayment);
router.put('/orders/:id/status', staffController.updateOrderStatus);
router.put('/orders/:id/cancel', staffController.cancelOrder);

// ── Inventory ──
router.get('/inventory', staffController.listInventory);
router.put('/inventory/variants/:variantId/stock', staffController.updateVariantStock);

// ── Products ──
router.get('/categories', staffController.listCategories);
router.get('/products', staffController.listProducts);
router.get('/products/:id', staffController.getProduct);
router.get('/products/:id/reviews', staffController.getProductReviews);
router.get('/reviews/:id', staffController.getReview);
router.post('/products', staffController.createProduct);
router.put('/products/:id', staffController.updateProduct);
router.post('/products/:id/images', uploadProductImage.single('image'), staffController.uploadProductImage);

// ── Coupons ──
router.get('/promos', staffController.listPromos);
router.get('/promos/:id', staffController.getPromo);
router.post('/promos', staffController.createPromo);
router.put('/promos/:id', staffController.updatePromo);
router.post('/promos/:id/push', staffController.pushPromo);

// ── Notifications ──
router.get('/notifications', staffController.listNotifications);
router.put('/notifications/:id/read', staffController.markNotificationRead);
router.put('/notifications/read-all', staffController.markAllNotificationsRead);
router.delete('/notifications/:id', staffController.deleteNotification);

module.exports = router;
