const { Schema, model } = require('mongoose');

const FIXED_ID = 'singleton';

const linkSchema = new Schema({
  label: { type: String },
  url: { type: String },
}, { _id: false });

const faqSchema = new Schema({
  question: { type: String },
  answer: { type: String },
}, { _id: false });

const appInfoSchema = new Schema({
  betaVersion: { type: String },
  latestVersion: { type: String },
  updateUrl: { type: String },
  notes: { type: String },
}, { _id: false });

const helpCenterSchema = new Schema({
  _id: { type: String, default: FIXED_ID },
  // Terms & Privacy
  termsSubtitle: { type: String, default: 'Get Instant Help, Contact Us....we are waiting' },
  termsContent: { type: String },
  privacyContent: { type: String },

  // FAQs
  faqs: { type: [faqSchema], default: [] },

  // Social Media & Privacy Policy
  socialSubtitle: { type: String, default: 'You can rate or Update on our Social Media' },
  socialLinks: { type: [linkSchema], default: [] },

  // Rate Us
  rateSubtitle: { type: String, default: 'You can rate Us on our Social Media' },
  rateLinks: { type: [linkSchema], default: [] },

  // App Info
  appInfoSubtitle: { type: String, default: 'You can get all the information relevant to this APP' },
  appInfo: { type: appInfoSchema, default: {} },
}, { timestamps: true });

helpCenterSchema.statics.getSingleton = async function() {
  const existing = await this.findById(FIXED_ID);
  if (existing) return existing;
  return this.create({ _id: FIXED_ID });
};

module.exports = { HelpCenter: model('HelpCenter', helpCenterSchema), HELP_CENTER_ID: FIXED_ID };
