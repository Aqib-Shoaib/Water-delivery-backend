const { Order } = require('../models/Order');
const { Expense } = require('../models/Expense');
const { SalarySlip } = require('../models/SalarySlip');
const { BankTransaction } = require('../models/BankTransaction');

function rangeFromQuery(query) {
  const { start, end } = query;
  const s = start ? new Date(start) : new Date(new Date().getFullYear(), 0, 1);
  const e = end ? new Date(end) : new Date();
  return { start: s, end: e };
}

async function profitAndLoss(req, res, next) {
  try {
    const { start, end } = rangeFromQuery(req.query);

    const [revAgg, expAgg, payrollAgg] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ['delivered', 'pending_payment'] } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      Expense.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, expenses: { $sum: '$amount' } } },
      ]),
      SalarySlip.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, payroll: { $sum: '$net' } } },
      ]),
    ]);

    const revenue = revAgg[0]?.revenue || 0;
    const expenses = (expAgg[0]?.expenses || 0) + (payrollAgg[0]?.payroll || 0);
    const profit = revenue - expenses;

    res.json({ range: { start, end }, revenue, expenses, profit });
  } catch (err) { next(err); }
}

async function cashFlow(req, res, next) {
  try {
    const { start, end } = rangeFromQuery(req.query);

    const [inAgg, outAgg] = await Promise.all([
      BankTransaction.aggregate([
        { $match: { date: { $gte: start, $lte: end }, type: { $in: ['deposit', 'transfer_in', 'receipt'] } } },
        { $group: { _id: null, totalIn: { $sum: '$amount' } } },
      ]),
      BankTransaction.aggregate([
        { $match: { date: { $gte: start, $lte: end }, type: { $in: ['withdrawal', 'transfer_out', 'payment'] } } },
        { $group: { _id: null, totalOut: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({ range: { start, end }, in: inAgg[0]?.totalIn || 0, out: outAgg[0]?.totalOut || 0 });
  } catch (err) { next(err); }
}

module.exports = { profitAndLoss, cashFlow };

// GET /api/finance/reports/vendors-paid?start=&end=
async function vendorsPaid(req, res, next) {
  try {
    const { start, end } = rangeFromQuery(req.query);
    const agg = await BankTransaction.aggregate([
      { $match: { date: { $gte: start, $lte: end }, type: 'payment' } },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
    ]);
    res.json({ range: { start, end }, totalPaid: agg[0]?.totalPaid || 0 });
  } catch (err) { next(err); }
}

module.exports.vendorsPaid = vendorsPaid;
