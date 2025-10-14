const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/payrollSettingsController');

const router = express.Router();

// Payroll Settings
router.get('/settings', authRequired(), requirePermission('salarySlips:read'), controller.get);
router.put('/settings', authRequired(), requirePermission('settings:write'), controller.upsert);

// Test calculation route (no real DB data required if overrides provided)
router.post('/test-calc', controller.testCalc);

module.exports = router;
