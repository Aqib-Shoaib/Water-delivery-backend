const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/purchaseOrdersController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('purchaseOrders:read'), controller.list);
router.post('/', authRequired(), requirePermission('purchaseOrders:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('purchaseOrders:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('purchaseOrders:write'), controller.remove);

module.exports = router;
