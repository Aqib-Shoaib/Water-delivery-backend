const express = require('express');
const controller = require('../controllers/productController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public list for now
router.get('/', controller.list);
// Admin-only mutations
router.post('/', authRequired(), requireRole('admin'), controller.create);
router.put('/:id', authRequired(), requireRole('admin'), controller.update);
router.delete('/:id', authRequired(), requireRole('admin'), controller.remove);

module.exports = router;
