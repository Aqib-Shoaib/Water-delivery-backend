const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/financeDashboardController');

const router = express.Router();

router.get('/overview', authRequired(), requirePermission('finance:read'), controller.overview);

module.exports = router;
