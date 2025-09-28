const { Schema, model } = require('mongoose');

// Health reminders to be shown in customer app.
// They can be shown randomly when active, or pinned to a specific day (dateOnly)
const healthReminderSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String },
    // If true, this reminder is eligible for random rotation in the customer app
    active: { type: Boolean, default: true },
    // Optional: ISO date string representing a specific day (no time component considered client-side)
    // Example value: '2025-09-30'
    dateOnly: { type: String },
    // Optional weight to bias random selection later
    weight: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = { HealthReminder: model('HealthReminder', healthReminderSchema) };
