const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/aboutController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('settings:write'), controller.get);
router.put('/', authRequired(), requirePermission('settings:write'), controller.update);

module.exports = router;
