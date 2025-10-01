const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const { list } = require('../controllers/auditLogController');

const router = express.Router();

// Only admins can read audit logs
router.get('/', authRequired(), requirePermission('audit:read'), list);

module.exports = router;
