const { Schema, model } = require('mongoose');

const regionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    // Optional: polygon or list of zip codes
    zipCodes: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = { Region: model('Region', regionSchema) };
