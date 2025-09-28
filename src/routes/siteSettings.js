const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const controller = require('../controllers/siteSettingController');

const router = express.Router();

router.get('/', authRequired(), requireRole('admin'), controller.get);
router.put('/', authRequired(), requireRole('admin'), controller.update);
router.post('/logo', authRequired(), requireRole('admin'), controller.uploadLogoMiddleware, controller.uploadLogo);
router.post('/customer-logo', authRequired(), requireRole('admin'), controller.uploadCustomerLogoMiddleware, controller.uploadCustomerLogo);
router.post('/driver-logo', authRequired(), requireRole('admin'), controller.uploadDriverLogoMiddleware, controller.uploadDriverLogo);

module.exports = router;
