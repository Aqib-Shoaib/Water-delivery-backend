const { Schema, model, Types } = require('mongoose');

const expenseSchema = new Schema(
  {
    date: { type: Date, default: () => new Date(), index: true },
    vendor: { type: Types.ObjectId, ref: 'Vendor' },
    category: { type: String, index: true }, // e.g., Fuel, Bottles, Maintenance, Utilities, Salary, etc.
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'bank', 'card', 'wallet'], default: 'cash' },
    reference: { type: String },
    notes: { type: String },
    receiptUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending', index: true },
    approvedBy: { type: Types.ObjectId, ref: 'User' },
    createdBy: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = { Expense: model('Expense', expenseSchema) };
