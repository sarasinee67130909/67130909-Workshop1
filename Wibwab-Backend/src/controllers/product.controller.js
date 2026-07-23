// controllers/product.controller.js — รับ req → เรียก service → ส่ง response
const productService = require('../services/product.service');

async function list(req, res, next) {
  try {
    const data = await productService.getProducts(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const data = await productService.getProductById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail };
