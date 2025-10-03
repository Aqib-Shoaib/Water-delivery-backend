const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/paymentsAnalyticsController');

const router = express.Router();

router.get('/totals', authRequired(), requirePermission('payments:read'), controller.totals);
router.get('/rows', authRequired(), requirePermission('payments:read'), controller.rows);

module.exports = router;
