const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const controller = require('../controllers/dealController');

const router = express.Router();

router.get('/', authRequired(), requireRole('admin'), controller.list);
router.post('/', authRequired(), requireRole('admin'), controller.create);
router.put('/:id', authRequired(), requireRole('admin'), controller.update);
router.delete('/:id', authRequired(), requireRole('admin'), controller.remove);

module.exports = router;
