const express = require('express');
const controller = require('../controllers/productController');
const { authRequired, requirePermission, requireRole } = require('../middleware/auth');
const productAnalytics = require('../controllers/productAnalyticsController');

const router = express.Router();

// Public list for now
router.get('/', controller.list);
// Admin-only mutations
router.post('/', authRequired(), requirePermission('products:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('products:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('products:write'), controller.remove);
// Upload product image
router.post('/upload-image', authRequired(), requirePermission('products:write'), controller.uploadImageMiddleware, controller.uploadImage);

// Analytics
router.get('/analytics/stock', authRequired(), requireRole('admin'), productAnalytics.stock);

module.exports = router;
