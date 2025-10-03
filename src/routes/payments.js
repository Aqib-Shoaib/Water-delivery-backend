const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/paymentLoanController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('payments:read'), controller.list);
router.post('/', authRequired(), requirePermission('payments:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('payments:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('payments:write'), controller.remove);

module.exports = router;
