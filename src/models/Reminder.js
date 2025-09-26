const { Schema, model } = require('mongoose');

const reminderSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    remindAt: { type: Date, required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = { Reminder: model('Reminder', reminderSchema) };
