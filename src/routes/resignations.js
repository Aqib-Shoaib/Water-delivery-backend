const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/resignationController');

const router = express.Router();
router.get('/', authRequired(), requirePermission('resignations:read'), controller.list);
router.post('/', authRequired(), requirePermission('resignations:write'), controller.create);
router.delete('/:id', authRequired(), requirePermission('resignations:write'), controller.remove);
module.exports = router;
