const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/attendanceController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('attendance:read'), controller.list);
router.post('/', authRequired(), requirePermission('attendance:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('attendance:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('attendance:write'), controller.remove);

module.exports = router;
