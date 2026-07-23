// controllers/favorite.controller.js — รับ req → เรียก service → ส่ง response
const favoriteService = require('../services/favorite.service');

async function list(req, res, next) {
  try {
    const data = await favoriteService.listFavorites(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function add(req, res, next) {
  try {
    const data = await favoriteService.addFavorite(req.user.id, req.params.productId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await favoriteService.removeFavorite(req.user.id, req.params.productId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, add, remove };
