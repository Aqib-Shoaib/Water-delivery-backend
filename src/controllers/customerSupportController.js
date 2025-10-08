const { SupportIssue } = require('../models/SupportIssue');

// GET /api/customer-support
// Returns only issues created by the current user
async function listMine(req, res, next) {
  try {
    const items = await SupportIssue.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email');
    res.json(items);
  } catch (err) { next(err); }
}

// POST /api/customer-support
// body: { title, description, priority? }
async function create(req, res, next) {
  try {
    const { title, description, priority = 'medium' } = req.body || {};
    if (!title || !description) return res.status(400).json({ message: 'title and description required' });
    const issue = await SupportIssue.create({ title, description, priority, createdBy: req.user._id });
    const doc = await issue.populate('createdBy', 'name email');
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

// GET /api/customer-support/:id
// Ensure the ticket belongs to current user
async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const issue = await SupportIssue.findOne({ _id: id, createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .populate('comments.author', 'name email');
    if (!issue) return res.status(404).json({ message: 'Not found' });
    res.json(issue);
  } catch (err) { next(err); }
}

// POST /api/customer-support/:id/comments
// body: { message }
async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ message: 'message required' });
    const issue = await SupportIssue.findOne({ _id: id, createdBy: req.user._id });
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

module.exports = { listMine, create, getOne, addComment };
