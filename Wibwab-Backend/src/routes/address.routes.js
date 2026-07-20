// routes/address.routes.js — CRUD ที่อยู่จัดส่ง (ต้องล็อกอินทุก route)
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const addressController = require('../controllers/address.controller');

router.use(verifyToken);

router.get('/', addressController.list);
router.post('/', addressController.create);
router.put('/:id', addressController.update);
router.delete('/:id', addressController.remove);
router.patch('/:id/default', addressController.setDefault);

module.exports = router;
