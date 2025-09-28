const { Notification } = require('../models/Notification')

async function list(req, res, next) {
  try {
    const items = await Notification.find({}).sort({ createdAt: -1 }).limit(200)
    res.json(items)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { title, message, type = 'info' } = req.body || {}
    if (!title) return res.status(400).json({ message: 'title required' })
    const doc = await Notification.create({ title, message, type })
    res.status(201).json(doc)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const { id } = req.params
    const { title, message, type, read } = req.body || {}
    const updates = {}
    if (title !== undefined) updates.title = title
    if (message !== undefined) updates.message = message
    if (type !== undefined) updates.type = type
    if (read !== undefined) updates.read = !!read
    const doc = await Notification.findByIdAndUpdate(id, updates, { new: true })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json(doc)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params
    const doc = await Notification.findByIdAndDelete(id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove }
