const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/siteSettingController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('settings:write'), controller.get);
router.put('/', authRequired(), requirePermission('settings:write'), controller.update);
router.post('/logo', authRequired(), requirePermission('settings:write'), controller.uploadLogoMiddleware, controller.uploadLogo);
router.post('/customer-logo', authRequired(), requirePermission('settings:write'), controller.uploadCustomerLogoMiddleware, controller.uploadCustomerLogo);
router.post('/driver-logo', authRequired(), requirePermission('settings:write'), controller.uploadDriverLogoMiddleware, controller.uploadDriverLogo);

module.exports = router;
