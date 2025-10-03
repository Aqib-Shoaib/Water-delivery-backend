const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/assetsController');

const router = express.Router();

router.get('/summary', authRequired(), requirePermission('assets:read'), controller.getSummary);
router.get('/stock', authRequired(), requirePermission('assets:read'), controller.getStock);

module.exports = router;
