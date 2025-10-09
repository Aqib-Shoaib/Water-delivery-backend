const { Schema, model } = require('mongoose');

// Enforce a singleton by using a fixed _id
const FIXED_ID = 'singleton';

const siteSettingSchema = new Schema(
  {
    _id: { type: String, default: FIXED_ID },
    siteName: { type: String, default: 'Water Delivery' },
    logoUrl: { type: String },
    // Legacy single fields (kept for backward compatibility in UI code and clients)
    contactEmail: { type: String },
    contactPhone: { type: String },
    // New multi-value fields
    emails: { type: [String], default: [] },
    phones: { type: [String], default: [] },
    address: { type: String },
    theme: { type: String, default: 'light' },
    whatsappLink: { type: String },
    whatsappPhone: { type: String },
    // About moved to standalone collection
    // Mobile apps (customer app)
    customerAppName: { type: String },
    customerAppLogoUrl: { type: String },
    customerAppAndroidLink: { type: String },
    customerAppIOSLink: { type: String },
    // Mobile apps (driver app)
    driverAppName: { type: String },
    driverAppLogoUrl: { type: String },
    driverAppAndroidLink: { type: String },
    driverAppIOSLink: { type: String },
  },
  { timestamps: true }
);

siteSettingSchema.statics.getSingleton = async function () {
  const existing = await this.findById(FIXED_ID);
  if (existing) return existing;
  return this.create({ _id: FIXED_ID });
};

module.exports = { SiteSetting: model('SiteSetting', siteSettingSchema), SETTINGS_ID: FIXED_ID };
