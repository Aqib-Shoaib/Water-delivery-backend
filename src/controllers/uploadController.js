const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '') || '.bin';
    const name = 'file_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });
const uploadSingle = upload.single('file');

async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'file required' });
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url: publicUrl, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  } catch (err) { next(err); }
}

module.exports = { uploadSingle, uploadFile };
