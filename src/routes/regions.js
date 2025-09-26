const express = require('express');
const controller = require('../controllers/regionController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired(), requireRole('admin'), controller.list);
router.post('/', authRequired(), requireRole('admin'), controller.create);
router.put('/:id', authRequired(), requireRole('admin'), controller.update);
router.delete('/:id', authRequired(), requireRole('admin'), controller.remove);

router.get('/:id/users', authRequired(), requireRole('admin'), controller.getUsers);
router.post('/:id/assign-users', authRequired(), requireRole('admin'), controller.assignUsers);

module.exports = router;
