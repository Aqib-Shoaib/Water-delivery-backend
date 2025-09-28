const { HealthReminder } = require('../models/HealthReminder')

async function list(req, res, next) {
  try {
    const items = await HealthReminder.find({}).sort({ createdAt: -1 }).limit(500)
    res.json(items)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { title, message, active = true, dateOnly, weight = 1 } = req.body || {}
    if (!title) return res.status(400).json({ message: 'title required' })
    const doc = await HealthReminder.create({ title, message, active: !!active, dateOnly: dateOnly || undefined, weight: Number(weight) || 1 })
    res.status(201).json(doc)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const { id } = req.params
    const { title, message, active, dateOnly, weight } = req.body || {}
    const updates = {}
    if (title !== undefined) updates.title = title
    if (message !== undefined) updates.message = message
    if (active !== undefined) updates.active = !!active
    if (dateOnly !== undefined) updates.dateOnly = dateOnly || undefined
    if (weight !== undefined) updates.weight = Number(weight)
    const doc = await HealthReminder.findByIdAndUpdate(id, updates, { new: true })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json(doc)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params
    const doc = await HealthReminder.findByIdAndDelete(id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove }
