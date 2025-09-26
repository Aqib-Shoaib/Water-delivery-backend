const express = require('express');

const health = require('./health');
const products = require('./products');
const orders = require('./orders');
const auth = require('./auth');
const adminUsers = require('./adminUsers');
const passwordResets = require('./passwordResets');
const supportIssues = require('./supportIssues');
const regions = require('./regions');
const siteSettings = require('./siteSettings');
const deals = require('./deals');
const reminders = require('./reminders');

const router = express.Router();

router.use('/health', health);
router.use('/auth', auth);
router.use('/products', products);
router.use('/orders', orders);
router.use('/admin/users', adminUsers);
router.use('/password-resets', passwordResets);
router.use('/support-issues', supportIssues);
router.use('/regions', regions);
router.use('/site-settings', siteSettings);
router.use('/deals', deals);
router.use('/reminders', reminders);

module.exports = router;
