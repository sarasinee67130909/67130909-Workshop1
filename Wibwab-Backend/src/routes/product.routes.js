// routes/product.routes.js — GET /api/products (list+filter), GET /api/products/:id (detail)
const router = require('express').Router();
const productController = require('../controllers/product.controller');

router.get('/', productController.list);
router.get('/:id', productController.detail);

module.exports = router;
