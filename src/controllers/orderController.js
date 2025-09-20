const { Order } = require('../models/Order');
const { Product } = require('../models/Product');

const list = async (req, res, next) => {
  try {
    const query = {}
    if (req.user?.role === 'customer') {
      query.customer = req.user._id
    } else if (req.user?.role === 'driver') {
      query.assignedDriver = req.user._id
    }
    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('assignedDriver', 'name email')
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
    const { customer, items, address, region, notes } = req.body;
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

    const order = await Order.create({ customer, items: itemDocs, totalAmount, address, region, notes });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update };
