const { HelpCenter, HELP_CENTER_ID } = require('../models/HelpCenter');
const { buildAuditFromReq } = require('../utils/auditLogger');

function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '');
}

async function get(req, res, next) {
  try {
    const hc = await HelpCenter.getSingleton();
    res.json(hc);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const {
      termsSubtitle,
      termsContent,
      privacyContent,
      faqs,
      socialSubtitle,
      socialLinks,
      rateSubtitle,
      rateLinks,
      appInfoSubtitle,
      appInfo,
    } = req.body || {};

    const updates = {};
    if (termsSubtitle !== undefined) updates.termsSubtitle = termsSubtitle;
    if (termsContent !== undefined) updates.termsContent = sanitizeHtml(termsContent);
    if (privacyContent !== undefined) updates.privacyContent = sanitizeHtml(privacyContent);
    if (Array.isArray(faqs)) updates.faqs = faqs;
    if (socialSubtitle !== undefined) updates.socialSubtitle = socialSubtitle;
    if (Array.isArray(socialLinks)) updates.socialLinks = socialLinks;
    if (rateSubtitle !== undefined) updates.rateSubtitle = rateSubtitle;
    if (Array.isArray(rateLinks)) updates.rateLinks = rateLinks;
    if (appInfoSubtitle !== undefined) updates.appInfoSubtitle = appInfoSubtitle;
    if (appInfo && typeof appInfo === 'object') updates.appInfo = appInfo;

    const doc = await HelpCenter.findByIdAndUpdate(HELP_CENTER_ID, updates, { new: true, upsert: true });

    buildAuditFromReq(req, {
      action: 'help-center:update',
      entity: 'HelpCenter',
      entityId: String(HELP_CENTER_ID),
      meta: { updates },
    });

    res.json(doc);
  } catch (err) { next(err); }
}

module.exports = { get, update };
