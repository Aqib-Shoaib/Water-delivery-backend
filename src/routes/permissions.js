const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const { ROLES } = require('../models/User');

const router = express.Router();

// Expose available permissions and roles to the admin UI
router.get('/', authRequired(), requirePermission('users:read'), (req, res) => {
  res.json({ permissions: PERMISSIONS, roles: ROLES });
});

module.exports = router;
