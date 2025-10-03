const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/attendanceAnalyticsController');

const router = express.Router();

router.get('/totals', authRequired(), requirePermission('attendance:read'), controller.totals);
router.get('/rows', authRequired(), requirePermission('attendance:read'), controller.perUser);

module.exports = router;
