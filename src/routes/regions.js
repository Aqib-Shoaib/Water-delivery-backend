const express = require('express');
const controller = require('../controllers/regionController');
const { authRequired, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired(), requirePermission('regions:read'), controller.list);
router.post('/', authRequired(), requirePermission('regions:write'), controller.create);
router.put('/:id', authRequired(), requirePermission('regions:write'), controller.update);
router.delete('/:id', authRequired(), requirePermission('regions:write'), controller.remove);

router.get('/:id/users', authRequired(), requirePermission('regions:read'), controller.getUsers);
router.post('/:id/assign-users', authRequired(), requirePermission('regions:write'), controller.assignUsers);

module.exports = router;
