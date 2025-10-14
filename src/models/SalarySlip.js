const { Schema, model, Types } = require('mongoose');

const salarySlipSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true, index: true }, // e.g., '2025-09'
    status: { type: String, enum: ['draft', 'finalized', 'paid'], default: 'draft', index: true },

    // Component breakdown used for auditability
    components: {
      derivedHourlyRate: { type: Number, default: 0 },
      baseSalary: { type: Number, default: 0 },
      workedNormalHours: { type: Number, default: 0 },
      regularAmount: { type: Number, default: 0 },
      workedPublicHolidayHours: { type: Number, default: 0 },
      publicHolidayHourlyRate: { type: Number, default: 0 },
      publicHolidayAmount: { type: Number, default: 0 },
      hourlyRate: { type: Number, default: 0 },
      workedHours: { type: Number, default: 0 },
      basicAmount: { type: Number, default: 0 },

      overtimeHours: { type: Number, default: 0 },
      overtimeRate: { type: Number, default: 0 },
      overtimeAmount: { type: Number, default: 0 },

      bottles: { type: Number, default: 0 },
      commissionPerBottle: { type: Number, default: 0 },
      commissionAmount: { type: Number, default: 0 },

      referralCount: { type: Number, default: 0 },
      referralRate: { type: Number, default: 0 },
      referralAmount: { type: Number, default: 0 },

      allowances: {
        type: [
          new Schema(
            { type: { type: String }, label: { type: String }, amount: { type: Number, default: 0 } },
            { _id: false }
          ),
        ],
        default: [],
      },

      annualBonus: { type: Number, default: 0 },
      annualLeaveSalary: { type: Number, default: 0 },
    },

    deductions: {
      items: {
        type: [
          new Schema(
            { type: { type: String }, label: { type: String }, amount: { type: Number, default: 0 } },
            { _id: false }
          ),
        ],
        default: [],
      },
      total: { type: Number, default: 0 },
    },

    vatRate: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },

    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    notes: { type: String },
    fileUrl: { type: String },
    issuedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

salarySlipSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = { SalarySlip: model('SalarySlip', salarySlipSchema) };
