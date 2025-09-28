const { Schema, model, Types } = require('mongoose');

const ROLES = ['admin', 'customer', 'driver'];

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    phone: { type: String },
    cnic: { type: String, unique: true, sparse: true, index: true },
    region: { type: Types.ObjectId, ref: 'Region', index: true },
    permissions: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

module.exports = { User: model('User', userSchema), ROLES };
