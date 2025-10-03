const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/historyController');

const router = express.Router();

router.get('/summary', authRequired(), requirePermission('analytics:read'), controller.summary);

module.exports = router;
