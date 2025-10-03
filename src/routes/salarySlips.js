const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/salarySlipController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('salarySlips:read'), controller.list);
router.post('/', authRequired(), requirePermission('salarySlips:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('salarySlips:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('salarySlips:write'), controller.remove);

module.exports = router;
