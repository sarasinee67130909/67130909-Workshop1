// controllers/staff.controller.js — รับ req → เรียก service → ส่ง response
const staffService = require('../services/staff.service');
const couponService = require('../services/coupon.service');
const notificationService = require('../services/notification.service');
const { STAFF_NOTIFICATION_TYPES } = require('../utils/notificationType');
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

async function getProductReviews(req, res, next) {
  try {
    const data = await staffService.getProductReviews(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getReview(req, res, next) {
  try {
    const data = await staffService.getReviewById(req.params.id);
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

// ── Coupons ──
async function listPromos(req, res, next) {
  try {
    const data = await couponService.listPromoCodes(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getPromo(req, res, next) {
  try {
    const data = await couponService.getPromoCode(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createPromo(req, res, next) {
  try {
    const data = await couponService.createPromoCode(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updatePromo(req, res, next) {
  try {
    const data = await couponService.updatePromoCode(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function pushPromo(req, res, next) {
  try {
    const data = await couponService.pushCouponToAllCustomers(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── Notifications ──
async function listNotifications(req, res, next) {
  try {
    const data = await notificationService.listNotifications(STAFF_NOTIFICATION_TYPES);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const data = await notificationService.markRead(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const data = await notificationService.markAllRead(STAFF_NOTIFICATION_TYPES);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const data = await notificationService.deleteNotification(req.params.id);
    res.json({ success: true, data });
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
  getProductReviews,
  getReview,
  createProduct,
  updateProduct,
  uploadProductImage,
  listPromos,
  getPromo,
  createPromo,
  updatePromo,
  pushPromo,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
