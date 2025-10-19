const { Schema, model, Types } = require('mongoose');

const vendorSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    gstVatNumber: { type: String },
    paymentTermsDays: { type: Number, default: 30 },
    defaultExpenseCategory: { type: String },
    notes: { type: String },
    balance: { type: Number, default: 0 }, // positive means payable to vendor
    lastTransactionAt: { type: Date },
    createdBy: { type: Types.ObjectId, ref: 'User' },
    updatedBy: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = { Vendor: model('Vendor', vendorSchema) };
