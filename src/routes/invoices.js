const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/invoiceController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('invoices:read'), controller.list);
router.post('/from-order/:orderId', authRequired(), requirePermission('invoices:write'), controller.createFromOrder);
router.post('/:id/mark-paid', authRequired(), requirePermission('invoices:write'), controller.markPaid);

module.exports = router;
