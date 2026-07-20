// controllers/admin.controller.js — รับ req → เรียก service → ส่ง response
const reportService = require('../services/report.service');

// GET /api/admin/dashboard?range=7d|30d
async function dashboard(req, res, next) {
  try {
    const data = await reportService.getDashboard(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/sales?from=&to=&category=
async function salesReport(req, res, next) {
  try {
    const data = await reportService.getSalesReport(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/stock
async function stockReport(req, res, next) {
  try {
    const data = await reportService.getStockReport();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/profit?from=&to=
async function profitReport(req, res, next) {
  try {
    const data = await reportService.getProfitReport(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, salesReport, stockReport, profitReport };