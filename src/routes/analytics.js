const express = require('express')
const { authRequired, requireRole } = require('../middleware/auth')
const ctrl = require('../controllers/analyticsController')

const router = express.Router()

router.get('/summary', authRequired(), requireRole('admin'), ctrl.summary)
router.get('/recent-orders', authRequired(), requireRole('admin'), ctrl.recentOrders)
router.get('/status-breakdown', authRequired(), requireRole('admin'), ctrl.statusBreakdown)
router.get('/upcoming-schedules', authRequired(), requireRole('admin'), ctrl.upcomingSchedules)
router.get('/top-customers', authRequired(), requireRole('admin'), ctrl.topCustomers)
router.get('/driver-insights', authRequired(), requireRole('admin'), ctrl.driverInsights)

module.exports = router
