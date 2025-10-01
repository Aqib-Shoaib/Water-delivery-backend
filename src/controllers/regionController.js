const { Region } = require('../models/Region');
const { User } = require('../models/User');
const { Order } = require('../models/Order');
const { buildAuditFromReq } = require('../utils/auditLogger');

// GET /api/regions
async function list(req, res, next) {
  try {
    const regions = await Region.find({}).sort({ createdAt: -1 });
    res.json(regions);
  } catch (err) { next(err); }
}

// POST /api/regions
// body: { name, description?, zipCodes?, active? }
async function create(req, res, next) {
  try {
    const { name, description, zipCodes = [], active = true } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name required' });
    const exists = await Region.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Region name already exists' });
    const region = await Region.create({ name, description, zipCodes, active });
    // audit
    buildAuditFromReq(req, {
      action: 'region:create',
      entity: 'Region',
      entityId: String(region._id),
      meta: { name, description, zipCodes, active }
    });
    res.status(201).json(region);
  } catch (err) { next(err); }
}
// PUT /api/regions/:id
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = {};
    const { name, description, zipCodes, active } = req.body || {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (zipCodes !== undefined) updates.zipCodes = zipCodes;
    if (active !== undefined) updates.active = active;

    const region = await Region.findByIdAndUpdate(id, updates, { new: true });
    if (!region) return res.status(404).json({ message: 'Not found' });
    // audit
    buildAuditFromReq(req, {
      action: 'region:update',
      entity: 'Region',
      entityId: String(region._id),
      meta: { updates }
    });
    res.json(region);
  } catch (err) { next(err); }
}

// DELETE /api/regions/:id
// Only allow delete when no linked users or orders exist
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const userCount = await User.countDocuments({ region: id });
    const orderCount = await Order.countDocuments({ region: id });
    if (userCount > 0 || orderCount > 0) {
      return res.status(400).json({ message: 'Region in use; cannot delete' });
    }
    const region = await Region.findByIdAndDelete(id);
    if (!region) return res.status(404).json({ message: 'Not found' });
    // audit
    buildAuditFromReq(req, {
      action: 'region:delete',
      entity: 'Region',
      entityId: String(region._id),
      meta: { name: region.name }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
}

// GET /api/regions/:id/users?role=driver|customer
async function getUsers(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.query;
    const filter = { region: id };
    if (role) filter.role = role;
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(users);
  } catch (err) { next(err); }
}

// POST /api/regions/:id/assign-users
// body: { userIds: ["..."], role?: 'driver'|'customer' }
async function assignUsers(req, res, next) {
  try {
    const { id } = req.params;
    const { userIds = [], role } = req.body || {};
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ message: 'userIds required' });
    const filter = { _id: { $in: userIds } };
    if (role) filter.role = role;
    const result = await User.updateMany(filter, { $set: { region: id } });
    // audit
    buildAuditFromReq(req, {
      action: 'region:assignUsers',
      entity: 'Region',
      entityId: String(id),
      meta: { userIds, role }
    });
    res.json({ matched: result.matchedCount ?? result.nMatched ?? 0, modified: result.modifiedCount ?? result.nModified ?? 0 });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, getUsers, assignUsers };
