const { Schema, model } = require('mongoose');

const productSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: String,
    // e.g., 0.5L, 1L, 19L bottle size
    sizeLiters: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = { Product: model('Product', productSchema) };
