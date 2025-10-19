const { Order } = require('../models/Order');
const { Product } = require('../models/Product');
const { buildAuditFromReq } = require('../utils/auditLogger');

const list = async (req, res, next) => {
  try {
    const baseMatch = {}
    if (req.user?.role === 'customer') {
      baseMatch.customer = req.user._id
    } else if (req.user?.role === 'driver') {
      baseMatch.assignedDriver = req.user._id
    }

    const q = (req.query.q || '').trim()
    if (q) {
      // Use aggregation to search across populated fields
      const rows = await Order.aggregate([
        { $match: baseMatch },
        { $lookup: { from: 'users', localField: 'customer', foreignField: '_id', as: 'customer' } },
        { $unwind: '$customer' },
        { $lookup: { from: 'users', localField: 'assignedDriver', foreignField: '_id', as: 'assignedDriver' } },
        { $unwind: { path: '$assignedDriver', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'users', localField: 'approvedBy', foreignField: '_id', as: 'approvedBy' } },
        { $unwind: { path: '$approvedBy', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        { $addFields: { productName: '$prod.name' } },
        { $match: { $or: [
          { 'customer.name': { $regex: q, $options: 'i' } },
          { 'assignedDriver.name': { $regex: q, $options: 'i' } },
          { productName: { $regex: q, $options: 'i' } },
          { status: { $regex: q, $options: 'i' } },
          { address: { $regex: q, $options: 'i' } },
        ] } },
        { $group: { _id: '$_id', doc: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$doc' } },
        { $sort: { createdAt: -1 } },
        { $limit: 100 },
      ])
      // For consistency with front-end expectations, shape subdocs similarly to populate
      return res.json(rows.map(r => ({
        ...r,
        items: (r.items || []).map(it => ({ ...it, product: r.prod || it.product })),
      })))
    }

    const orders = await Order.find(baseMatch)
      .populate('customer', 'name email')
      .populate('assignedDriver', 'name email')
      .populate('approvedBy', 'name email companyPhone')
      .populate('items.product', 'name sizeLiters price')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    let { customer, items, address, region, notes } = req.body;
    // For customer role, bind order to the authenticated user to prevent spoofing
    if (req.user?.role === 'customer') {
      customer = req.user._id;
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items required' });
    }

    // Resolve product prices for a safe total
    const itemDocs = [];
    let totalAmount = 0;
    for (const it of items) {
      const product = await Product.findById(it.product);
      if (!product) return res.status(400).json({ message: 'invalid product in items' });
      const quantity = Number(it.quantity || 0);
      if (!quantity || quantity < 1) return res.status(400).json({ message: 'invalid quantity' });
      const unitPrice = product.price;
      totalAmount += unitPrice * quantity;
      itemDocs.push({ product: product._id, quantity, unitPrice });
    }

    const order = await Order.create({
      customer,
      items: itemDocs,
      totalAmount,
      address,
      region,
      notes,
      status: 'pending_payment',
      paymentStatus: 'pending',
    });
    // audit
    buildAuditFromReq(req, {
      action: 'order:create',
      entity: 'Order',
      entityId: String(order._id),
      meta: { customer, address, region, notes, totalAmount, items: itemDocs }
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patch = { ...req.body };
    // auto transitions
    if (patch.assignedDriver !== undefined) {
      patch.status = patch.assignedDriver ? 'driver_assigned' : (patch.status || undefined);
    }
    if (patch.status === 'delivered') {
      patch.deliveredAt = new Date();
    }
    const order = await Order.findByIdAndUpdate(id, patch, { new: true });
    if (!order) return res.status(404).json({ message: 'Not found' });
    // audit
    buildAuditFromReq(req, {
      action: 'order:update',
      entity: 'Order',
      entityId: String(order._id),
      meta: { update: patch }
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update };
