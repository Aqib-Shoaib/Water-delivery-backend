const { Schema, model, Types } = require('mongoose');

const salarySlipSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true, index: true }, // e.g., '2025-09'
    gross: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    notes: { type: String },
    fileUrl: { type: String },
    issuedAt: { type: Date },
  },
  { timestamps: true }
);

salarySlipSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = { SalarySlip: model('SalarySlip', salarySlipSchema) };
