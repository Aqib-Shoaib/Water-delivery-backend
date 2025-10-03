// Minimal assets controller to support frontend Assets.jsx
// NOTE: Replace with real data sources when available.

async function getSummary(req, res) {
  try {
    // Placeholder summary. Wire to DB aggregations later.
    const summary = {
      inboundEmpty: 0,
      outboundEmpty: 0,
      inhandEmpty: 0,
      damagedEmpty: 0,
      inboundDisp: 0,
      outboundDisp: 0,
      inhandDisp: 0,
      damagedDisp: 0,
      availableProducts: 0,
      upcomingProducts: 0,
      vendorsCount: 0,
    }
    return res.json(summary)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load summary' })
  }
}

async function getStock(req, res) {
  try {
    // Placeholder list. Replace with DB query.
    const items = []
    return res.json(items)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load stock' })
  }
}

module.exports = { getSummary, getStock }
