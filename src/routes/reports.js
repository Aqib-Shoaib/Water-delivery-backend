const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/reportsController');

const router = express.Router();

router.get('/profit-loss', authRequired(), requirePermission('reports:read'), controller.profitAndLoss);
router.get('/cash-flow', authRequired(), requirePermission('reports:read'), controller.cashFlow);
router.get('/vendors-paid', authRequired(), requirePermission('reports:read'), controller.vendorsPaid);

module.exports = router;
