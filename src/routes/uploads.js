const express = require('express');
const { authRequired, requirePermission } = require('../middleware/auth');
const { uploadSingle, uploadFile } = require('../controllers/uploadController');

const router = express.Router();

// Generic file upload. Returns { url, filename, size, mimetype }
router.post('/', authRequired(), requirePermission('files:write'), uploadSingle, uploadFile);

module.exports = router;
