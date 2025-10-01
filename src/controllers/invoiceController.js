const { Invoice } = require('../models/Invoice');
const { Order } = require('../models/Order');
const { buildAuditFromReq } = require('../utils/auditLogger');

function generateNumber() {
  const ts = Date.now();
  return 'INV-' + ts;
}

// GET /api/invoices
// query: page, limit, status, q (number), orderId
async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, status, q, orderId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (orderId) filter.order = orderId;
    if (q) filter.number = new RegExp(q, 'i');
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Invoice.find(filter)
        .populate('order', 'customer totalAmount status paymentStatus')
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

// POST /api/invoices/from-order/:orderId
async function createFromOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('items.product', 'name');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.invoice) return res.status(400).json({ message: 'Invoice already exists for this order' });

    const lineItems = (order.items || []).map(it => ({
      product: it.product?._id,
      description: it.product?.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      amount: it.quantity * it.unitPrice,
    }));
    const subtotal = order.totalAmount;
    const tax = 0;
    const total = subtotal + tax;

    const number = generateNumber();
    const invoice = await Invoice.create({
      order: order._id,
      number,
      status: 'pending',
      lineItems,
      subtotal,
      tax,
      total,
      customer: order.customer,
    });

    order.paymentStatus = 'pending';
    order.status = 'pending_payment';
    order.invoice = invoice._id;
    await order.save();

    // audit
    buildAuditFromReq(req, {
      action: 'invoice:create',
      entity: 'Invoice',
      entityId: String(invoice._id),
      meta: { orderId: String(order._id), number }
    });

    res.status(201).json(invoice);
  } catch (err) { next(err); }
}

// POST /api/invoices/:id/mark-paid
async function markPaid(req, res, next) {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ message: 'Already paid' });

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    // update linked order
    if (invoice.order) {
      await Order.findByIdAndUpdate(invoice.order, { $set: { paymentStatus: 'paid' } });
    }

    // audit
    buildAuditFromReq(req, {
      action: 'invoice:markPaid',
      entity: 'Invoice',
      entityId: String(invoice._id)
    });

    res.json(invoice);
  } catch (err) { next(err); }
}

module.exports = { list, createFromOrder, markPaid };
