const { About, ABOUT_ID } = require('../models/About');
const { buildAuditFromReq } = require('../utils/auditLogger');

async function get(req, res, next) {
  try {
    const about = await About.getSingleton();
    res.json(about);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const {
      missionStatement,
      visionStatement,
      ceoMessage,
      hqAddress,
      customerFeedbackLink,
      socialLinks,
      usefulLinks,
    } = req.body || {};

    const updates = {};
    if (missionStatement !== undefined) updates.missionStatement = missionStatement;
    if (visionStatement !== undefined) updates.visionStatement = visionStatement;
    if (ceoMessage !== undefined) updates.ceoMessage = ceoMessage;
    if (hqAddress !== undefined) updates.hqAddress = hqAddress;
    if (customerFeedbackLink !== undefined) updates.customerFeedbackLink = customerFeedbackLink;
    if (Array.isArray(socialLinks)) updates.socialLinks = socialLinks;
    if (Array.isArray(usefulLinks)) updates.usefulLinks = usefulLinks;

    const about = await About.findByIdAndUpdate(ABOUT_ID, updates, { new: true, upsert: true });

    buildAuditFromReq(req, {
      action: 'about:update',
      entity: 'About',
      entityId: String(ABOUT_ID),
      meta: { updates },
    });

    res.json(about);
  } catch (err) { next(err); }
}

module.exports = { get, update };
