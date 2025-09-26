const { Schema, model } = require('mongoose');

// Enforce a singleton by using a fixed _id
const FIXED_ID = 'singleton';

const siteSettingSchema = new Schema(
  {
    _id: { type: String, default: FIXED_ID },
    siteName: { type: String, default: 'Water Delivery' },
    logoUrl: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    address: { type: String },
    theme: { type: String, default: 'light' },
    whatsappLink: { type: String },
    whatsappPhone: { type: String },
  },
  { timestamps: true }
);

siteSettingSchema.statics.getSingleton = async function () {
  const existing = await this.findById(FIXED_ID);
  if (existing) return existing;
  return this.create({ _id: FIXED_ID });
};

module.exports = { SiteSetting: model('SiteSetting', siteSettingSchema), SETTINGS_ID: FIXED_ID };
