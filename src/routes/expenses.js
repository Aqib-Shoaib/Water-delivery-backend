const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/expensesController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('expenses:read'), controller.list);
router.post('/', authRequired(), requirePermission('expenses:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('expenses:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('expenses:write'), controller.remove);

module.exports = router;
