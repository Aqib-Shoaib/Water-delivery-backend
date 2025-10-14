const { SalarySlip } = require('../models/SalarySlip');
const { computeForUserMonth } = require('../services/payrollService');
const PDFDocument = require('pdfkit');

async function list(req, res, next) {
  try {
    const { user, month } = req.query;
    const filter = {};
    if (user) filter.user = user;
    if (month) filter.month = month;
    const items = await SalarySlip.find(filter)
      .populate('user', 'name email employeeId department designation')
      .sort({ month: -1 })
      .limit(500);
    res.json(items);
  } catch (e) { next(e); }
}
// New: download slip as PDF
async function downloadPdf(req, res, next) {
  try {
    const { id } = req.params;
    const s = await SalarySlip.findById(id).populate('user', 'name email employeeId department designation').lean();
    if (!s) return res.status(404).json({ message: 'Not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${s.month}-${s.user?.employeeId || s.user?._id}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    doc.pipe(res);

    doc.fontSize(16).text('Salary Slip', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10)
      .text(`Employee: ${s.user?.name || ''}`)
      .text(`Employee ID: ${s.user?.employeeId || ''}`)
      .text(`Email: ${s.user?.email || ''}`)
      .text(`Department: ${s.user?.department || ''}`)
      .text(`Designation: ${s.user?.designation || ''}`)
      .text(`Month: ${s.month}`)
      .text(`Status: ${s.status}`);

    doc.moveDown();
    const c = s.components || {};
    doc.fontSize(12).text('Components', { underline: true });
    doc.fontSize(10)
      .text(`Base Salary: ${c.baseSalary ?? 0}`)
      .text(`Derived Hourly Rate: ${c.derivedHourlyRate ?? c.hourlyRate ?? 0}`)
      .text(`Worked Normal Hours: ${c.workedNormalHours ?? c.workedHours ?? 0}`)
      .text(`Regular Amount: ${c.regularAmount ?? c.basicAmount ?? 0}`)
      .text(`Public Holiday Hours: ${c.workedPublicHolidayHours ?? 0}`)
      .text(`Public Holiday Hourly Rate: ${c.publicHolidayHourlyRate ?? 0}`)
      .text(`Public Holiday Amount: ${c.publicHolidayAmount ?? 0}`)
      .text(`Overtime Hours: ${c.overtimeHours ?? 0}`)
      .text(`Overtime Rate: ${c.overtimeRate ?? 0}`)
      .text(`Overtime Amount: ${c.overtimeAmount ?? 0}`)
      .text(`Bottles: ${c.bottles ?? 0}`)
      .text(`Commission/Bottle: ${c.commissionPerBottle ?? 0}`)
      .text(`Commission Amount: ${c.commissionAmount ?? 0}`)
      .text(`Referral Count: ${c.referralCount ?? 0}`)
      .text(`Referral Rate: ${c.referralRate ?? 0}`)
      .text(`Referral Amount: ${c.referralAmount ?? 0}`)
      .text(`Annual Bonus: ${c.annualBonus ?? 0}`)
      .text(`Annual Leave Salary: ${c.annualLeaveSalary ?? 0}`);

    const allowances = Array.isArray(c.allowances) ? c.allowances : [];
    if (allowances.length) {
      doc.moveDown(0.5).text('Allowances:', { underline: true });
      allowances.forEach(a => {
        doc.text(`- ${a.label || a.type || 'Allowance'}: ${a.amount || 0}`);
      });
    }

    const deductionsTotal = s.deductions?.total || 0;
    doc.moveDown().fontSize(12).text('Totals', { underline: true });
    doc.fontSize(10)
      .text(`VAT Rate: ${s.vatRate || 0}`)
      .text(`VAT Amount: ${s.vatAmount || 0}`)
      .text(`Deductions Total: ${deductionsTotal}`)
      .text(`Gross: ${s.gross || 0}`)
      .text(`Net: ${s.net || 0}`);

    if (s.notes) {
      doc.moveDown().fontSize(12).text('Notes', { underline: true });
      doc.fontSize(10).text(String(s.notes));
    }

    doc.end();
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const { user, month, gross = 0, deductions = 0, net = 0, notes, fileUrl } = req.body || {};
    if (!user || !month) return res.status(400).json({ message: 'user and month required' });
    const doc = await SalarySlip.create({ user, month, gross, deductions, net, notes, fileUrl, issuedAt: new Date() });
    res.status(201).json(doc);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { gross, deductions, net, notes, fileUrl } = req.body || {};
    const doc = await SalarySlip.findByIdAndUpdate(id, { gross, deductions, net, notes, fileUrl }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await SalarySlip.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) { next(e); }
}

// New: compute preview without saving
async function preview(req, res, next) {
  try {
    const { userId, month, overrides } = req.body || {};
    if (!userId || !month) return res.status(400).json({ message: 'userId and month required' });
    const calc = await computeForUserMonth({ userId, month, overrides: overrides || {} });
    res.json(calc);
  } catch (e) { next(e); }
}

// New: generate or upsert a draft slip for user+month
async function generate(req, res, next) {
  try {
    const { userId, month, overrides, notes } = req.body || {};
    if (!userId || !month) return res.status(400).json({ message: 'userId and month required' });
    const calc = await computeForUserMonth({ userId, month, overrides: overrides || {} });
    const update = {
      user: userId,
      month,
      status: 'draft',
      ...calc,
      notes: notes || calc.notes,
    };
    const doc = await SalarySlip.findOneAndUpdate({ user: userId, month }, update, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.status(201).json(doc);
  } catch (e) { next(e); }
}

// New: finalize a slip
async function finalize(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await SalarySlip.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = 'finalized';
    if (!doc.issuedAt) doc.issuedAt = new Date();
    await doc.save();
    res.json(doc);
  } catch (e) { next(e); }
}

// New: mark slip paid
async function pay(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await SalarySlip.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = 'paid';
    doc.paidAt = new Date();
    await doc.save();
    res.json(doc);
  } catch (e) { next(e); }
}

// New: export CSV for a month
async function exportCsv(req, res, next) {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'month required (YYYY-MM)' });
    const slips = await SalarySlip.find({ month }).populate('user', 'name email employeeId department designation').lean();
    const headers = [
      'Employee Name','Employee ID','Email','Department','Designation','Month','Status','Worked Hours','Overtime Hours','Hourly Rate','Overtime Rate','Bottles','Commission/Bottle','Referral Count','Referral Rate','Allowances Total','Deductions Total','Annual Bonus','Annual Leave Salary','VAT Rate','VAT Amount','Gross','Net'
    ];
    const lines = [headers.join(',')];
    for (const s of slips) {
      const allowancesTotal = (s.components?.allowances || []).reduce((a, b) => a + (b.amount || 0), 0);
      const row = [
        (s.user?.name || ''),
        (s.user?.employeeId || ''),
        (s.user?.email || ''),
        (s.user?.department || ''),
        (s.user?.designation || ''),
        s.month,
        s.status,
        s.components?.workedHours ?? 0,
        s.components?.overtimeHours ?? 0,
        s.components?.hourlyRate ?? 0,
        s.components?.overtimeRate ?? 0,
        s.components?.bottles ?? 0,
        s.components?.commissionPerBottle ?? 0,
        s.components?.referralCount ?? 0,
        s.components?.referralRate ?? 0,
        allowancesTotal,
        s.deductions?.total ?? 0,
        s.components?.annualBonus ?? 0,
        s.components?.annualLeaveSalary ?? 0,
        s.vatRate ?? 0,
        s.vatAmount ?? 0,
        s.gross ?? 0,
        s.net ?? 0,
      ];
      lines.push(row.map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : v).join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="salary-slips-${month}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove, preview, generate, finalize, pay, exportCsv, downloadPdf };
