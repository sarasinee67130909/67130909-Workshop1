// controllers/review.controller.js — รับ req → เรียก service → ส่ง response
const reviewService = require('../services/review.service');

async function create(req, res, next) {
  try {
    const data = await reviewService.createReview(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { create };
