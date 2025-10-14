const { Schema, model } = require('mongoose');

const payrollSettingsSchema = new Schema(
  {
    hourlyRate: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 0 },
    // New global settings for derived-hourly computation
    baseSalary: { type: Number, default: 0 },
    maxHoursPerDay: { type: Number, default: 10 },
    publicHolidayHourlyRate: { type: Number },
    commissionPerBottle: { type: Number, default: 1.5 },
    referralRate: { type: Number, default: 1000 },
    workingDaysPerMonth: { type: Number, default: 26 },
    workingHoursPerDay: { type: Number, default: 10 },
    vatRate: { type: Number, default: 0 },
    applyVatTo: { type: String, enum: ['none', 'gross_addon', 'deduct_from_net'], default: 'none' },
  },
  { timestamps: true }
);

// Singleton pattern: we will always use the latest document.
module.exports = { PayrollSettings: model('PayrollSettings', payrollSettingsSchema) };
