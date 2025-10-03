const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/warningController');

const router = express.Router();
router.get('/', authRequired(), requirePermission('warnings:read'), controller.list);
router.post('/', authRequired(), requirePermission('warnings:write'), controller.create);
router.delete('/:id', authRequired(), requirePermission('warnings:write'), controller.remove);
module.exports = router;
