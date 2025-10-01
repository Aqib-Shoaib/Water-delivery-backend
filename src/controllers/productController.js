const { Product } = require('../models/Product');
const { buildAuditFromReq } = require('../utils/auditLogger');

const list = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description, sizeLiters, price, active } = req.body;
    const product = await Product.create({ name, description, sizeLiters, price, active });
    // audit
    buildAuditFromReq(req, {
      action: 'product:create',
      entity: 'Product',
      entityId: String(product._id),
      meta: { name, description, sizeLiters, price, active }
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Not found' });
    // audit
    buildAuditFromReq(req, {
      action: 'product:update',
      entity: 'Product',
      entityId: String(product._id),
      meta: { update: req.body }
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

