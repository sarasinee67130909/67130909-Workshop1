// routes/admin.routes.js — /api/admin/* dashboard และรายงาน
// ทุก route ต้องผ่าน verifyToken + requireRole('admin') เท่านั้น (กติกาข้อ 5 ของ PROJECT_STRUCTURE.md)
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const adminController = require('../controllers/admin.controller');

router.use(verifyToken, requireRole('admin'));

// ── Dashboard ──
router.get('/dashboard', adminController.dashboard);
router.get('/dashboard/export', adminController.dashboardExport);

// ── รายงาน ──
router.get('/reports/sales', adminController.salesReport);
router.get('/reports/stock', adminController.stockReport);
router.get('/reports/profit', adminController.profitReport);

// ── ส่งออกรายงาน (Excel/PDF) ──
router.get('/reports/sales/export', adminController.salesReportExport);
router.get('/reports/stock/export', adminController.stockReportExport);
router.get('/reports/profit/export', adminController.profitReportExport);

module.exports = router;