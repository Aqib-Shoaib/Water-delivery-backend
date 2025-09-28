const { Schema, model } = require('mongoose');

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    read: { type: Boolean, default: false },
    // Optional linking to entities
    entityType: { type: String },
    entityId: { type: String },
  },
  { timestamps: true }
);

module.exports = { Notification: model('Notification', notificationSchema) };
