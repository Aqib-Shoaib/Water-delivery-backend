const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/employeeAnalyticsController');

const router = express.Router();
router.get('/totals', authRequired(), requirePermission('employeeAnalytics:read'), controller.totals);
module.exports = router;
