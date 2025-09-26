const { Deal } = require('../models/Deal')

async function list(req, res, next) {
  try {
    const items = await Deal.find({}).sort({ createdAt: -1 }).limit(200)
    res.json(items)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { title, description, startDate, endDate, active = true } = req.body || {}
    if (!title) return res.status(400).json({ message: 'title required' })
    const doc = await Deal.create({ title, description, startDate, endDate, active })
    res.status(201).json(doc)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const { id } = req.params
    const { title, description, startDate, endDate, active } = req.body || {}
    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (startDate !== undefined) updates.startDate = startDate
    if (endDate !== undefined) updates.endDate = endDate
    if (active !== undefined) updates.active = !!active
    const doc = await Deal.findByIdAndUpdate(id, updates, { new: true })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json(doc)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params
    const doc = await Deal.findByIdAndDelete(id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove }
