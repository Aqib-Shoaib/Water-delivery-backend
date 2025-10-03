const { Schema, model, Types } = require('mongoose');

const docSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    kind: { type: String, enum: ['doc', 'form', 'policy', 'template'], default: 'doc' },
    createdBy: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = { Doc: model('Doc', docSchema) };
