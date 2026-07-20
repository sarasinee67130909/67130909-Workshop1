// controllers/address.controller.js — รับ req → เรียก service → ส่ง response
const addressService = require('../services/address.service');

async function list(req, res, next) {
  try {
    const data = await addressService.list(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await addressService.create(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = await addressService.update(req.user.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await addressService.remove(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function setDefault(req, res, next) {
  try {
    const data = await addressService.setDefault(req.user.id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, setDefault };
