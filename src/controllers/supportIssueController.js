const { SupportIssue } = require('../models/SupportIssue');

// GET /api/support-issues
// Optional query: status, createdBy, assignee, q (search in title/description)
async function list(req, res, next) {
  try {
    const { status, createdBy, assignee, q } = req.query || {};
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const query = {};
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy;
    if (assignee) query.assignee = assignee;
    if (q) query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];

    const [total, items] = await Promise.all([
      SupportIssue.countDocuments(query),
      SupportIssue.find(query)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    ]);
    const pages = Math.ceil(total / limit) || 1;
    res.json({ items, total, page, pages, limit });
  } catch (err) { next(err); }
}

// POST /api/support-issues
// body: { title, description, priority }
async function create(req, res, next) {
  try {
    const { title, description, priority = 'medium' } = req.body || {};
    if (!title || !description) return res.status(400).json({ message: 'title and description required' });
    const issue = await SupportIssue.create({ title, description, priority, createdBy: req.user._id });
    const doc = await issue.populate('createdBy', 'name email');
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// PUT /api/support-issues/:id
// body: { title?, description?, status?, assignee?, priority? }
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, status, assignee, priority } = req.body || {};
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (assignee !== undefined) updates.assignee = assignee || undefined;
    if (priority !== undefined) updates.priority = priority;

    const issue = await SupportIssue.findByIdAndUpdate(id, updates, { new: true })
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email');
    if (!issue) return res.status(404).json({ message: 'Not found' });
    res.json(issue);
  } catch (err) { next(err); }
}

// POST /api/support-issues/:id/comments
// body: { message }
async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ message: 'message required' });

    const issue = await SupportIssue.findById(id);
    if (!issue) return res.status(404).json({ message: 'Not found' });
    issue.comments.push({ author: req.user._id, message });
    await issue.save();
    const doc = await issue.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'assignee', select: 'name email' },
      { path: 'comments.author', select: 'name email' },
    ]);
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// DELETE /api/support-issues/:id
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await SupportIssue.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, addComment, remove };
