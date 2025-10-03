const { Schema, model } = require('mongoose');

const assetSchema = new Schema(
  {
    itemName: { type: String, required: true },
    itemCode: { type: String },
    qty: { type: Number, default: 0 },
    itemType: { type: String, index: true }, // e.g., 'bottle', 'dispenser'
    itemCondition: { type: String, index: true }, // e.g., 'in-bound','out-bound','in-hand','damaged'
    allotToDepartment: { type: String },
    approvedBy: { type: String },
    designation: { type: String },
    contactDetails: { type: String },
    vendorName: { type: String, index: true },
    vendorMobile: { type: String },
    vendorAddress: { type: String },
    vendorCompany: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

module.exports = { Asset: model('Asset', assetSchema) };
