// controllers/staff.controller.js — รับ req → เรียก service → ส่ง response
const staffService = require('../services/staff.service');
const { httpError } = require('../utils/validators');

// ── Dashboard ──
async function dashboard(req, res, next) {
  try {
    const data = await staffService.getDashboard();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── Orders ──
async function listOrders(req, res, next) {
  try {
    const data = await staffService.getOrders(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const data = await staffService.getOrderById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function verifyOrderPayment(req, res, next) {
  try {
    const data = await staffService.verifyPayment(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const data = await staffService.updateOrderStatus(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const data = await staffService.cancelOrder(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── Inventory ──
async function listInventory(req, res, next) {
  try {
    const data = await staffService.getInventory(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateVariantStock(req, res, next) {
  try {
    const data = await staffService.adjustVariantStock(req.params.variantId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── Products ──
async function listCategories(req, res, next) {
  try {
    const data = await staffService.getCategories();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const data = await staffService.getStaffProducts(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const data = await staffService.getStaffProductById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    // form ส่ง variants มาเป็น JSON string เมื่อใช้ multipart/form-data (คู่กับไฟล์รูป)
    const body = { ...req.body };
    if (typeof body.variants === 'string') body.variants = JSON.parse(body.variants);
    const data = await staffService.createProduct(body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const body = { ...req.body };
    if (typeof body.variants === 'string') body.variants = JSON.parse(body.variants);
    const data = await staffService.updateProduct(req.params.id, body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function uploadProductImage(req, res, next) {
  try {
    if (!req.file) throw httpError(400, 'กรุณาแนบไฟล์รูปภาพ');
    const filePath = `/uploads/products/${req.file.filename}`;
    const data = await staffService.addProductImage(req.params.id, filePath, req.body.is_primary === 'true');
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  dashboard,
  listOrders,
  getOrder,
  verifyOrderPayment,
  updateOrderStatus,
  cancelOrder,
  listInventory,
  updateVariantStock,
  listCategories,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  uploadProductImage,
};
