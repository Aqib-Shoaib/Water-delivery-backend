const { Schema, model, Types } = require('mongoose');

const MESSAGE_STATUS = ['draft', 'sent', 'scheduled'];

const messageSchema = new Schema(
  {
    subject: { type: String, default: '' },
    body: { type: String, default: '' }, // rich text (HTML) supported

    sender: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    recipients: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [], index: true },

    status: { type: String, enum: MESSAGE_STATUS, default: 'draft', index: true },
    scheduledAt: { type: Date, index: true },
    sentAt: { type: Date, index: true },

    // derived or set flag to support Premium section
    isPremiumSender: { type: Boolean, default: false, index: true },

    // per-user trash (soft delete). If a user's id is in this list, the message is in their Trash
    trashedFor: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [], index: true },
  },
  { timestamps: true }
);

module.exports = { Message: model('Message', messageSchema), MESSAGE_STATUS };
