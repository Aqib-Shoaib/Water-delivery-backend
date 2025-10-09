const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { SiteSetting, SETTINGS_ID } = require('../models/SiteSetting');
const { buildAuditFromReq } = require('../utils/auditLogger');

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
    const {
      siteName,
      contactEmail,
      contactPhone,
      emails,
      phones,
      address,
      theme,
      logoUrl,
      whatsappLink,
      whatsappPhone,
      // Mobile apps
      customerAppName,
      customerAppLogoUrl,
      customerAppAndroidLink,
      customerAppIOSLink,
      driverAppName,
      driverAppLogoUrl,
      driverAppAndroidLink,
      driverAppIOSLink,
    } = req.body || {};
    if (siteName !== undefined) updates.siteName = siteName;
    // New arrays handling with backward compatible single fields
    if (Array.isArray(emails)) {
      const sanitized = emails.map(e => String(e || '').trim()).filter(Boolean);
      updates.emails = sanitized;
      // keep legacy single field in sync (first email)
      updates.contactEmail = sanitized[0] || '';
    } else if (contactEmail !== undefined) {
      updates.contactEmail = contactEmail;
    }
    if (Array.isArray(phones)) {
      const sanitizedPh = phones.map(p => String(p || '').trim()).filter(Boolean);
      updates.phones = sanitizedPh;
      // keep legacy single field in sync (first phone)
      updates.contactPhone = sanitizedPh[0] || '';
    } else if (contactPhone !== undefined) {
      updates.contactPhone = contactPhone;
    }
    if (address !== undefined) updates.address = address;
    if (theme !== undefined) updates.theme = theme;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl; // allow manual URL set
    if (whatsappLink !== undefined) updates.whatsappLink = whatsappLink;
    // Keep whatsappPhone only if explicitly provided (legacy support)
    if (whatsappPhone !== undefined) updates.whatsappPhone = whatsappPhone;
    // About moved to standalone controller/model (no longer handled here)
    // Mobile apps
    if (customerAppName !== undefined) updates.customerAppName = customerAppName;
    if (customerAppLogoUrl !== undefined) updates.customerAppLogoUrl = customerAppLogoUrl;
    if (customerAppAndroidLink !== undefined) updates.customerAppAndroidLink = customerAppAndroidLink;
    if (customerAppIOSLink !== undefined) updates.customerAppIOSLink = customerAppIOSLink;
    if (driverAppName !== undefined) updates.driverAppName = driverAppName;
    if (driverAppLogoUrl !== undefined) updates.driverAppLogoUrl = driverAppLogoUrl;
    if (driverAppAndroidLink !== undefined) updates.driverAppAndroidLink = driverAppAndroidLink;
    if (driverAppIOSLink !== undefined) updates.driverAppIOSLink = driverAppIOSLink;
    const settings = await SiteSetting.findByIdAndUpdate(SETTINGS_ID, updates, { new: true, upsert: true });
    // audit
    buildAuditFromReq(req, {
      action: 'settings:update',
      entity: 'SiteSetting',
      entityId: String(SETTINGS_ID),
      meta: { updates }
    });
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
    // audit
    buildAuditFromReq(req, {
      action: 'settings:uploadLogo',
      entity: 'SiteSetting',
      entityId: String(SETTINGS_ID),
      meta: { logoUrl: publicUrl }
    });
    res.json({ logoUrl: publicUrl, settings });
  } catch (err) { next(err); }
}

// Upload customer app logo
const uploadCustomerLogoMiddleware = upload.single('logo');
async function uploadCustomerLogo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'logo file required' });
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const settings = await SiteSetting.findByIdAndUpdate(
      SETTINGS_ID,
      { customerAppLogoUrl: publicUrl },
      { new: true, upsert: true }
    );
    // audit
    buildAuditFromReq(req, {
      action: 'settings:uploadCustomerLogo',
      entity: 'SiteSetting',
      entityId: String(SETTINGS_ID),
      meta: { customerAppLogoUrl: publicUrl }
    });
    res.json({ customerAppLogoUrl: publicUrl, settings });
  } catch (err) { next(err); }
}

// Upload driver app logo
const uploadDriverLogoMiddleware = upload.single('logo');
async function uploadDriverLogo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'logo file required' });
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const settings = await SiteSetting.findByIdAndUpdate(
      SETTINGS_ID,
      { driverAppLogoUrl: publicUrl },
      { new: true, upsert: true }
    );
    // audit
    buildAuditFromReq(req, {
      action: 'settings:uploadDriverLogo',
      entity: 'SiteSetting',
      entityId: String(SETTINGS_ID),
      meta: { driverAppLogoUrl: publicUrl }
    });
    res.json({ driverAppLogoUrl: publicUrl, settings });
  } catch (err) { next(err); }
}

module.exports = {
  get,
  update,
  uploadLogo,
  uploadLogoMiddleware,
  uploadCustomerLogo,
  uploadCustomerLogoMiddleware,
  uploadDriverLogo,
  uploadDriverLogoMiddleware,
};
