const { PaymentLoan } = require('../models/PaymentLoan');

async function list(req, res, next) {
  try {
    const { user } = req.query;
    const filter = {};
    if (user) filter.user = user;
    const items = await PaymentLoan.find(filter).sort({ date: -1, createdAt: -1 }).limit(1000);
    res.json(items);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { user, type, amount, date, note,
      applicationStatus, approvedAmount, monthlyInstallment, installmentsTotal, durationMonths,
      approvedByName, approvedByDesignation, approvedByPhone,
      confirmedByName, confirmedByDesignation, confirmedByPhone,
      receiptUrl } = req.body || {};
    if (!user || !type || typeof amount !== 'number') return res.status(400).json({ message: 'user, type, amount required' });
    const doc = await PaymentLoan.create({ user, type, amount, date, note,
      applicationStatus, approvedAmount, monthlyInstallment, installmentsTotal, durationMonths,
      approvedByName, approvedByDesignation, approvedByPhone,
      confirmedByName, confirmedByDesignation, confirmedByPhone,
      receiptUrl });
    res.status(201).json(doc);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { type, amount, date, note,
      applicationStatus, approvedAmount, monthlyInstallment, installmentsTotal, durationMonths,
      approvedByName, approvedByDesignation, approvedByPhone,
      confirmedByName, confirmedByDesignation, confirmedByPhone,
      receiptUrl } = req.body || {};
    const updates = { };
    if (type !== undefined) updates.type = type;
    if (amount !== undefined) updates.amount = amount;
    if (date !== undefined) updates.date = date;
    if (note !== undefined) updates.note = note;
    if (applicationStatus !== undefined) updates.applicationStatus = applicationStatus;
    if (approvedAmount !== undefined) updates.approvedAmount = approvedAmount;
    if (monthlyInstallment !== undefined) updates.monthlyInstallment = monthlyInstallment;
    if (installmentsTotal !== undefined) updates.installmentsTotal = installmentsTotal;
    if (durationMonths !== undefined) updates.durationMonths = durationMonths;
    if (approvedByName !== undefined) updates.approvedByName = approvedByName;
    if (approvedByDesignation !== undefined) updates.approvedByDesignation = approvedByDesignation;
    if (approvedByPhone !== undefined) updates.approvedByPhone = approvedByPhone;
    if (confirmedByName !== undefined) updates.confirmedByName = confirmedByName;
    if (confirmedByDesignation !== undefined) updates.confirmedByDesignation = confirmedByDesignation;
    if (confirmedByPhone !== undefined) updates.confirmedByPhone = confirmedByPhone;
    if (receiptUrl !== undefined) updates.receiptUrl = receiptUrl;
    const doc = await PaymentLoan.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await PaymentLoan.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove };
