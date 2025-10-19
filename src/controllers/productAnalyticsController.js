const { Order } = require('../models/Order');
const { PurchaseOrder } = require('../models/PurchaseOrder');
const { Product } = require('../models/Product');

function rangeFromQuery(query) {
  const { start, end } = query;
  const s = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const e = end ? new Date(end) : new Date();
  return { start: s, end: e };
}

// GET /api/products/analytics/stock?start=&end=
async function stock(req, res, next) {
  try {
    const { start, end } = rangeFromQuery(req.query);

    const [outboundAgg, inboundAgg] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', outboundQty: { $sum: '$items.quantity' } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', inboundQty: { $sum: '$items.quantity' } } },
      ]),
    ]);

    const productIds = [...new Set([...outboundAgg.map(a => String(a._id)), ...inboundAgg.map(a => String(a._id))])].filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).select('name sizeLiters');
    const prodMap = products.reduce((acc, p) => { acc[String(p._id)] = { name: p.name, sizeLiters: p.sizeLiters }; return acc; }, {});

    const dataById = {};
    inboundAgg.forEach(a => { const id = String(a._id); if (!dataById[id]) dataById[id] = {}; dataById[id].inbound = a.inboundQty || 0; });
    outboundAgg.forEach(a => { const id = String(a._id); if (!dataById[id]) dataById[id] = {}; dataById[id].outbound = a.outboundQty || 0; });

    const rows = Object.entries(dataById).map(([id, v]) => {
      const meta = prodMap[id] || {};
      const inbound = v.inbound || 0;
      const outbound = v.outbound || 0;
      const onHand = Math.max(0, inbound - outbound);
      const isDispenser = /dispenser/i.test(meta.name || '');
      const category = isDispenser ? 'dispenser' : 'bottle';
      return { productId: id, name: meta.name || 'Unknown', sizeLiters: meta.sizeLiters, category, inbound, outbound, onHand };
    });

    const totals = rows.reduce((acc, r) => {
      const key = r.category;
      if (!acc[key]) acc[key] = { inbound: 0, outbound: 0, onHand: 0 };
      acc[key].inbound += r.inbound;
      acc[key].outbound += r.outbound;
      acc[key].onHand += r.onHand;
      return acc;
    }, {});

    res.json({ range: { start, end }, items: rows, totals });
  } catch (err) { next(err); }
}

module.exports = { stock };
