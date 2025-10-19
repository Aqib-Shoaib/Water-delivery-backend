const { BankAccount } = require('../models/BankAccount');
const { BankTransaction } = require('../models/BankTransaction');
const { buildAuditFromReq } = require('../utils/auditLogger');

async function listAccounts(req, res, next) {
  try {
    const items = await BankAccount.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) { next(err); }
}

async function createAccount(req, res, next) {
  try {
    const doc = await BankAccount.create(req.body);
    buildAuditFromReq(req, { action: 'bank:account:create', entity: 'BankAccount', entityId: String(doc._id) });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

async function updateAccount(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await BankAccount.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'bank:account:update', entity: 'BankAccount', entityId: String(doc._id) });
    res.json(doc);
  } catch (err) { next(err); }
}

async function removeAccount(req, res, next) {
  try {
    const { id } = req.params;
    await BankTransaction.deleteMany({ account: id });
    const doc = await BankAccount.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    buildAuditFromReq(req, { action: 'bank:account:delete', entity: 'BankAccount', entityId: String(id) });
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function listTransactions(req, res, next) {
  try {
    const { accountId } = req.params;
    const { page = 1, limit = 50, start, end, type } = req.query;
    const filter = { account: accountId };
    if (type) filter.type = type;
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total, inAgg, outAgg] = await Promise.all([
      BankTransaction.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      BankTransaction.countDocuments(filter),
      BankTransaction.aggregate([
        { $match: Object.assign({}, filter, { type: { $in: ['deposit', 'transfer_in', 'receipt'] } }) },
        { $group: { _id: null, totalIn: { $sum: '$amount' } } },
      ]),
      BankTransaction.aggregate([
        { $match: Object.assign({}, filter, { type: { $in: ['withdrawal', 'transfer_out', 'payment'] } }) },
        { $group: { _id: null, totalOut: { $sum: '$amount' } } },
      ]),
    ]);
    res.json({ items, total, totals: { in: inAgg[0]?.totalIn || 0, out: outAgg[0]?.totalOut || 0 }, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function createTransaction(req, res, next) {
  try {
    const { account } = req.body;
    const doc = await BankTransaction.create(req.body);
    // naive balance maintenance (can be refined via reconciliation)
    const acc = await BankAccount.findById(account);
    if (acc) {
      const t = doc.type;
      const sign = ['deposit', 'transfer_in', 'receipt'].includes(t) ? 1 : -1;
      acc.currentBalance = (acc.currentBalance || 0) + sign * (doc.amount || 0);
      await acc.save();
    }
    buildAuditFromReq(req, { action: 'bank:tx:create', entity: 'BankTransaction', entityId: String(doc._id) });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

async function removeTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await BankTransaction.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    // reverse balance effect
    const acc = await BankAccount.findById(doc.account);
    if (acc) {
      const t = doc.type;
      const sign = ['deposit', 'transfer_in', 'receipt'].includes(t) ? 1 : -1;
      acc.currentBalance = (acc.currentBalance || 0) - sign * (doc.amount || 0);
      await acc.save();
    }
    buildAuditFromReq(req, { action: 'bank:tx:delete', entity: 'BankTransaction', entityId: String(id) });
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { listAccounts, createAccount, updateAccount, removeAccount, listTransactions, createTransaction, removeTransaction };
