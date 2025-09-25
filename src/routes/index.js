const express = require('express');

const health = require('./health');
const products = require('./products');
const orders = require('./orders');
const auth = require('./auth');
const adminUsers = require('./adminUsers');
const passwordResets = require('./passwordResets');
const supportIssues = require('./supportIssues');

const router = express.Router();

router.use('/health', health);
router.use('/auth', auth);
router.use('/products', products);
router.use('/orders', orders);
router.use('/admin/users', adminUsers);
router.use('/password-resets', passwordResets);
router.use('/support-issues', supportIssues);

module.exports = router;
