const express = require('express');

const health = require('./health');
const products = require('./products');
const orders = require('./orders');
const auth = require('./auth');

const router = express.Router();

router.use('/health', health);
router.use('/auth', auth);
router.use('/products', products);
router.use('/orders', orders);

module.exports = router;
