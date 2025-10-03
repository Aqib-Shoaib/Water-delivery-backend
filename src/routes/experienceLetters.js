const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const controller = require('../controllers/experienceController');

const router = express.Router();
router.get('/', authRequired(), requirePermission('experienceLetters:read'), controller.list);
router.post('/', authRequired(), requirePermission('experienceLetters:write'), controller.create);
router.delete('/:id', authRequired(), requirePermission('experienceLetters:write'), controller.remove);
module.exports = router;
