const express = require('express');
const controller = require('../controllers/orderController');
const { authRequired, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Any authenticated user can list/create; controller filters by role
router.get('/', authRequired(), controller.list);
router.post('/', authRequired(), controller.create);
router.put('/:id', authRequired(), requirePermission('orders:write'), controller.update);

module.exports = router;
