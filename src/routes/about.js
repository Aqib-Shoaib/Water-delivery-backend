const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/aboutController');

const router = express.Router();

// Public GET for customer apps
router.get('/', controller.get);
router.put('/', authRequired(), requirePermission('settings:write'), controller.update);

module.exports = router;
