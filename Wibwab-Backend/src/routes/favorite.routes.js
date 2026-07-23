// routes/favorite.routes.js — GET/POST/DELETE /api/favorites (รายการโปรดของลูกค้าที่ล็อกอิน)
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const favoriteController = require('../controllers/favorite.controller');

router.get('/', verifyToken, favoriteController.list);
router.post('/:productId', verifyToken, favoriteController.add);
router.delete('/:productId', verifyToken, favoriteController.remove);

module.exports = router;
