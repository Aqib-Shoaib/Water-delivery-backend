const { Schema, model, Types } = require('mongoose');

const purchaseOrderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product' },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    vendor: { type: Types.ObjectId, ref: 'Vendor', required: true, index: true },
    status: { type: String, enum: ['draft', 'issued', 'received', 'cancelled'], default: 'draft', index: true },
    issuedAt: { type: Date },
    expectedAt: { type: Date },
    receivedAt: { type: Date },
    currency: { type: String, default: 'USD' },
    items: { type: [purchaseOrderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
    createdBy: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = { PurchaseOrder: model('PurchaseOrder', purchaseOrderSchema) };
