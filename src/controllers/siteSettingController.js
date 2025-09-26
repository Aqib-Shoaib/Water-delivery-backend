const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { SiteSetting, SETTINGS_ID } = require('../models/SiteSetting');

// Storage for logo uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '') || '.png';
    const name = 'logo_' + Date.now() + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

async function get(req, res, next) {
  try {
    const settings = await SiteSetting.getSingleton();
    res.json(settings);
  } catch (err) { next(err); }
}

// JSON update (no file)
async function update(req, res, next) {
  try {
    const updates = {};
    const { siteName, contactEmail, contactPhone, address, theme, logoUrl, whatsappLink, whatsappPhone } = req.body || {};
    if (siteName !== undefined) updates.siteName = siteName;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (contactPhone !== undefined) updates.contactPhone = contactPhone;
    if (address !== undefined) updates.address = address;
    if (theme !== undefined) updates.theme = theme;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl; // allow manual URL set
    if (whatsappLink !== undefined) updates.whatsappLink = whatsappLink;
    if (whatsappPhone !== undefined) updates.whatsappPhone = whatsappPhone;
    const settings = await SiteSetting.findByIdAndUpdate(SETTINGS_ID, updates, { new: true, upsert: true });
    res.json(settings);
  } catch (err) { next(err); }
}

// Multipart upload for logo
const uploadLogoMiddleware = upload.single('logo');

async function uploadLogo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'logo file required' });
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const settings = await SiteSetting.findByIdAndUpdate(SETTINGS_ID, { logoUrl: publicUrl }, { new: true, upsert: true });
    res.json({ logoUrl: publicUrl, settings });
  } catch (err) { next(err); }
}

module.exports = { get, update, uploadLogo, uploadLogoMiddleware };
