const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/dutyResumptionController');

const router = express.Router();
router.get('/', authRequired(), requirePermission('dutyResumptions:read'), controller.list);
router.post('/', authRequired(), requirePermission('dutyResumptions:write'), controller.create);
router.delete('/:id', authRequired(), requirePermission('dutyResumptions:write'), controller.remove);
module.exports = router;
