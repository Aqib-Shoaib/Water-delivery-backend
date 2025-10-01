const express = require('express');
const controller = require('../controllers/orderController');
const { authRequired, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired(), requirePermission('orders:read'), controller.list);
router.post('/', authRequired(), requirePermission('orders:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('orders:write'), controller.update);

module.exports = router;
