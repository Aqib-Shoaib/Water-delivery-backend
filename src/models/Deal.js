const { Schema, model } = require('mongoose');

const dealSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = { Deal: model('Deal', dealSchema) };
