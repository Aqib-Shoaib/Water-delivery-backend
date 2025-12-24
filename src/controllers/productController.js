const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Product } = require('../models/Product');
const { buildAuditFromReq } = require('../utils/auditLogger');

// Upload storage for product images
const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '') || '.png';
    const name = 'product_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });

const list = async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    // if category logic if needed, but not requested yet.
    
    // active check? usually we want active products only for customers?
    // The current controller returns all. Let's keep it simple but add search.
    
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description, sizeLiters, price, active, images } = req.body;
    const product = await Product.create({
      name,
      description,
      sizeLiters,
      price,
      active,
      images: Array.isArray(images) ? images : [],
    });
    // audit
    buildAuditFromReq(req, {
      action: 'product:create',
      entity: 'Product',
      entityId: String(product._id),
      meta: { name, description, sizeLiters, price, active, images: product.images }
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    if (update.images && !Array.isArray(update.images)) delete update.images; // enforce array
    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!product) return res.status(404).json({ message: 'Not found' });
    // audit
    buildAuditFromReq(req, {
      action: 'product:update',
      entity: 'Product',
      entityId: String(product._id),
      meta: { update }
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    // audit
    buildAuditFromReq(req, {
      action: 'product:delete',
      entity: 'Product',
      entityId: String(product._id),
      meta: { name: product.name }
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };

// Image upload endpoints
const uploadImageMiddleware = upload.single('image');
async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file required' });
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
    return res.json({ url: publicUrl });
  } catch (err) { next(err); }
}

module.exports.uploadImage = uploadImage;
module.exports.uploadImageMiddleware = uploadImageMiddleware;

