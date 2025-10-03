const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/supervisorController');

const router = express.Router();

router.get('/', authRequired(), requirePermission('supervisors:read'), controller.list);
router.post('/', authRequired(), requirePermission('supervisors:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('supervisors:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('supervisors:write'), controller.remove);

module.exports = router;
