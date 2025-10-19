const { Order } = require('../models/Order');
const { Invoice } = require('../models/Invoice');
const { Expense } = require('../models/Expense');
const { SalarySlip } = require('../models/SalarySlip');
const { Product } = require('../models/Product');

function parseDateRange(query) {
  const { start, end } = query;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    start: start ? new Date(start) : monthStart,
    end: end ? new Date(end) : monthEnd,
  };
}

async function overview(req, res, next) {
  try {
    const { start, end } = parseDateRange(req.query);

    const [revenueAgg, expenseAgg, pendingInvoices, productSales] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ['delivered', 'pending_payment'] } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      Expense.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, expenses: { $sum: '$amount' } } },
      ]),
      Invoice.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' }, amount: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } } } },
        { $sort: { qty: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const revenue = revenueAgg[0]?.revenue || 0;
    const expenses = expenseAgg[0]?.expenses || 0;
    const profit = revenue - expenses;

    // populate product names
    const productIds = productSales.map(p => p._id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).select('name');
    const productMap = products.reduce((acc, p) => { acc[p._id] = p.name; return acc; }, {});

    res.json({
      range: { start, end },
      kpis: {
        totalRevenue: revenue,
        totalExpenses: expenses,
        profitLoss: profit,
        pendingInvoices,
      },
      salesByProduct: productSales.map(p => ({ productId: p._id, name: productMap[p._id] || 'Unknown', quantity: p.qty, amount: p.amount })),
    });
  } catch (err) { next(err); }
}

module.exports = { overview };
