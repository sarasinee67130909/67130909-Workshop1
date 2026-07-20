// controllers/admin.controller.js — รับ req → เรียก service → ส่ง response
const reportService = require('../services/report.service');
const exportService = require('../services/export.service');
const { httpError } = require('../utils/validators');

// ตั้งชื่อไฟล์ + header ให้ browser ดาวน์โหลดไฟล์แทนการแสดงผลใน tab
function sendFile(res, buffer, filename, contentType) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}

function resolveFormat(req) {
  const format = (req.query.format || 'xlsx').toLowerCase();
  if (format !== 'xlsx' && format !== 'pdf') {
    throw httpError(400, 'รูปแบบไฟล์ไม่ถูกต้อง (รองรับเฉพาะ xlsx, pdf)');
  }
  return format;
}


// GET /api/admin/dashboard?range=7d|30d
async function dashboard(req, res, next) {
  try {
    const data = await reportService.getDashboard(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/dashboard/export?range=7d|30d&format=xlsx|pdf
async function dashboardExport(req, res, next) {
  try {
    const format = resolveFormat(req);
    const data = await reportService.getDashboard(req.query);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `dashboard-overview_${data.range}_${today}.${format}`;
    if (format === 'pdf') {
      const buffer = await exportService.buildDashboardPdf(data);
      sendFile(res, buffer, filename, 'application/pdf');
    } else {
      const buffer = await exportService.buildDashboardExcel(data);
      sendFile(res, buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
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

// GET /api/admin/reports/sales/export?from=&to=&category=&format=xlsx|pdf
async function salesReportExport(req, res, next) {
  try {
    const format = resolveFormat(req);
    const data = await reportService.getSalesReport(req.query);
    const filename = `sales-report_${data.range.from}_to_${data.range.to}.${format}`;
    if (format === 'pdf') {
      const buffer = await exportService.buildSalesPdf(data);
      sendFile(res, buffer, filename, 'application/pdf');
    } else {
      const buffer = await exportService.buildSalesExcel(data);
      sendFile(res, buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/stock/export?format=xlsx|pdf
async function stockReportExport(req, res, next) {
  try {
    const format = resolveFormat(req);
    const data = await reportService.getStockReport();
    const today = new Date().toISOString().slice(0, 10);
    const filename = `stock-report_${today}.${format}`;
    if (format === 'pdf') {
      const buffer = await exportService.buildStockPdf(data);
      sendFile(res, buffer, filename, 'application/pdf');
    } else {
      const buffer = await exportService.buildStockExcel(data);
      sendFile(res, buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/profit/export?from=&to=&format=xlsx|pdf
async function profitReportExport(req, res, next) {
  try {
    const format = resolveFormat(req);
    const data = await reportService.getProfitReport(req.query);
    const filename = `profit-report_${data.range.from}_to_${data.range.to}.${format}`;
    if (format === 'pdf') {
      const buffer = await exportService.buildProfitPdf(data);
      sendFile(res, buffer, filename, 'application/pdf');
    } else {
      const buffer = await exportService.buildProfitExcel(data);
      sendFile(res, buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  dashboard,
  dashboardExport,
  salesReport,
  stockReport,
  profitReport,
  salesReportExport,
  stockReportExport,
  profitReportExport,
};