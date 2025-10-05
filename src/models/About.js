const { Schema, model } = require('mongoose');

// Singleton About document
const FIXED_ID = 'about';

const aboutSchema = new Schema(
  {
    _id: { type: String, default: FIXED_ID },
    missionStatement: { type: String },
    visionStatement: { type: String },
    ceoMessage: { type: String },
    hqAddress: { type: String },
    customerFeedbackLink: { type: String },
    socialLinks: { type: [{ label: String, icon: String, url: String }], default: [] },
    usefulLinks: { type: [{ label: String, url: String }], default: [] },
  },
  { timestamps: true }
);

aboutSchema.statics.getSingleton = async function () {
  const existing = await this.findById(FIXED_ID);
  if (existing) return existing;
  return this.create({ _id: FIXED_ID });
};

module.exports = { About: model('About', aboutSchema), ABOUT_ID: FIXED_ID };
