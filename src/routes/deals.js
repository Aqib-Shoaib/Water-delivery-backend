const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/dealController');

const router = express.Router();

// Public list of active deals for customer apps
router.get('/public', controller.listPublic);
// Admin-only list and mutations
router.get('/', authRequired(), requirePermission('deals:read'), controller.list);
router.post('/', authRequired(), requirePermission('deals:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('deals:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('deals:write'), controller.remove);

module.exports = router;
