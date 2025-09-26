const { Reminder } = require('../models/Reminder')

async function list(req, res, next) {
  try {
    const items = await Reminder.find({}).sort({ remindAt: 1, createdAt: -1 }).limit(200)
    res.json(items)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { title, description, remindAt, done = false } = req.body || {}
    if (!title || !remindAt) return res.status(400).json({ message: 'title and remindAt required' })
    const doc = await Reminder.create({ title, description, remindAt, done })
    res.status(201).json(doc)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const { id } = req.params
    const { title, description, remindAt, done } = req.body || {}
    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (remindAt !== undefined) updates.remindAt = remindAt
    if (done !== undefined) updates.done = !!done
    const doc = await Reminder.findByIdAndUpdate(id, updates, { new: true })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json(doc)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params
    const doc = await Reminder.findByIdAndDelete(id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove }
