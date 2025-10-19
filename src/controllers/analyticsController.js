const { Order } = require('../models/Order')
const { User } = require('../models/User')
const { SupportIssue } = require('../models/SupportIssue')

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d, { weekStartsOn = 1 } = {}) {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  x.setDate(x.getDate() - diff)
  return x
}

function startOfMonth(d) {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

function rangeToStart(range) {
  const now = new Date()
  if (range === 'day') return startOfDay(now)
  if (range === 'week') return startOfWeek(now, { weekStartsOn: 1 })
  return startOfMonth(now)
}

async function ordersCountByStatus(since) {
  const match = since ? { createdAt: { $gte: since } } : {}
  const rows = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])
  const out = {}
  for (const r of rows) out[r._id] = r.count
  return out
}

async function revenueBreakdown(since) {
  const match = since ? { createdAt: { $gte: since } } : {}
  const delivered = await Order.aggregate([
    { $match: { ...match, status: 'delivered' } },
    { $group: { _id: null, amount: { $sum: '$totalAmount' } } },
  ])
  const pending = await Order.aggregate([
    { $match: { ...match, status: { $in: ['placed', 'assigned', 'en_route'] } } },
    { $group: { _id: null, amount: { $sum: '$totalAmount' } } },
  ])
  const cancelled = await Order.aggregate([
    { $match: { ...match, status: { $in: ['cancelled', 'failed'] } } },
    { $group: { _id: null, amount: { $sum: '$totalAmount' } } },
  ])
  return {
    delivered: delivered[0]?.amount || 0,
    pending: pending[0]?.amount || 0,
    cancelled: cancelled[0]?.amount || 0,
  }
}

async function activeUsers(since) {
  const customers = await User.countDocuments({ role: 'customer', updatedAt: { $gte: since } })
  const drivers = await User.countDocuments({ role: 'driver', updatedAt: { $gte: since } })
  return { customers, drivers }
}

async function deliveryPerformance(since) {
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: 'delivered' } },
    { $project: { createdAt: 1, deliveredAt: 1, eta: 1, diffMin: { $divide: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 60000] }, ontime: { $cond: [{ $and: ['$eta', '$deliveredAt', { $lte: ['$deliveredAt', '$eta'] }] }, 1, 0] }, delayed: { $cond: [{ $and: ['$eta', '$deliveredAt', { $gt: ['$deliveredAt', '$eta'] }] }, 1, 0] } } },
    { $group: { _id: null, avgMins: { $avg: '$diffMin' }, total: { $sum: 1 }, ontime: { $sum: '$ontime' }, delayed: { $sum: '$delayed' } } },
  ])
  const r = rows[0] || { avgMins: 0, total: 0, ontime: 0, delayed: 0 }
  return { avgMinutes: r.avgMins || 0, onTimeRate: r.total ? Math.round((r.ontime / r.total) * 100) : 0, delayed: r.delayed || 0 }
}

async function customerAcquisition(since) {
  const newCustomers = await User.countDocuments({ role: 'customer', createdAt: { $gte: since } })
  const repeatAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$customer', cnt: { $sum: 1 } } },
    { $group: { _id: null, totalCustomers: { $sum: 1 }, repeats: { $sum: { $cond: [{ $gte: ['$cnt', 2] }, 1, 0] } } } },
  ])
  const r = repeatAgg[0] || { totalCustomers: 0, repeats: 0 }
  const repeatRate = r.totalCustomers ? Math.round((r.repeats / r.totalCustomers) * 100) : 0
  return { newCustomers, repeatRate }
}

async function summary(req, res, next) {
  try {
    const range = (req.query.range || 'month').toLowerCase()
    const since = rangeToStart(range)

    const [ordersToday, ordersWeek, ordersMonth, revenue, active, perf, acquisition] = await Promise.all([
      ordersCountByStatus(startOfDay(new Date())),
      ordersCountByStatus(startOfWeek(new Date(), { weekStartsOn: 1 })),
      ordersCountByStatus(startOfMonth(new Date())),
      revenueBreakdown(since),
      activeUsers(startOfWeek(new Date(), { weekStartsOn: 1 })),
      deliveryPerformance(since),
      customerAcquisition(since),
    ])

    res.json({ orders: { today: ordersToday, week: ordersWeek, month: ordersMonth }, revenue, activeUsers: active, deliveryPerformance: perf, customerAcquisition: acquisition })
  } catch (err) { next(err) }
}

async function recentOrders(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 25)
    const rows = await Order.find({}).sort({ createdAt: -1 }).limit(limit).populate('customer', 'name email').populate('assignedDriver', 'name email').lean()
    res.json(rows)
  } catch (err) { next(err) }
}

async function statusBreakdown(req, res, next) {
  try {
    const range = (req.query.range || 'month').toLowerCase()
    const since = rangeToStart(range)
    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const out = {}
    for (const r of rows) out[r._id] = r.count
    res.json(out)
  } catch (err) { next(err) }
}

async function upcomingSchedules(req, res, next) {
  try {
    const now = new Date()
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const rows = await Order.find({ eta: { $gte: startOfDay(now), $lte: in7 } }).sort({ eta: 1 }).limit(50).populate('customer', 'name email').populate('assignedDriver', 'name email').lean()
    res.json(rows)
  } catch (err) { next(err) }
}

async function topCustomers(req, res, next) {
  try {
    const range = (req.query.range || 'month').toLowerCase()
    const since = rangeToStart(range)
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50)
    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$customer', orders: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
      { $sort: { orders: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, orders: 1, amount: 1, avgOrderValue: { $cond: [{ $gt: ['$orders', 0] }, { $divide: ['$amount', '$orders'] }, 0] }, name: '$user.name', email: '$user.email' } },
    ])
    res.json(rows)
  } catch (err) { next(err) }
}

async function driverInsights(req, res, next) {
  try {
    const range = (req.query.range || 'week').toLowerCase()
    const since = rangeToStart(range)
    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$assignedDriver', deliveries: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { driverId: '$_id', deliveries: 1, name: '$user.name', email: '$user.email' } },
      { $sort: { deliveries: -1 } },
      { $limit: 50 },
    ])
    res.json(rows)
  } catch (err) { next(err) }
}

module.exports = { summary, recentOrders, statusBreakdown, upcomingSchedules, topCustomers, driverInsights }

// New: Order Management stats
async function orderManagementStats(req, res, next) {
  try {
    // totals
    const [totalOrders, cancelledOrders, codOrders, complaintsTotal, staffComplaints, productComplaints] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: { $in: ['cancelled', 'failed'] } }),
      Order.countDocuments({ paymentMethod: 'cod' }),
      SupportIssue.countDocuments({}),
      SupportIssue.countDocuments({ category: 'staff' }),
      SupportIssue.countDocuments({ category: 'product' }),
    ])

    // pending orders: any status not closed
    const pendingOrders = await Order.countDocuments({ status: { $nin: ['delivered', 'cancelled', 'failed'] } })

    // on-time vs delayed among delivered with ETA
    const deliveredPerf = await Order.aggregate([
      { $match: { status: 'delivered', eta: { $ne: null }, deliveredAt: { $ne: null } } },
      { $project: { ontime: { $cond: [{ $lte: ['$deliveredAt', '$eta'] }, 1, 0] } } },
      { $group: { _id: null, ontime: { $sum: '$ontime' }, total: { $sum: 1 } } },
    ])
    const ontime = deliveredPerf[0]?.ontime || 0
    const totalWithEta = deliveredPerf[0]?.total || 0
    const delayed = totalWithEta - ontime

    // satisfaction: average rating across orders that have it
    const satisfactionAgg = await Order.aggregate([
      { $match: { satisfaction: { $gte: 1 } } },
      { $group: { _id: null, avg: { $avg: '$satisfaction' }, votes: { $sum: 1 } } },
    ])
    const satisfaction = { average: Number((satisfactionAgg[0]?.avg || 0).toFixed(2)), votes: satisfactionAgg[0]?.votes || 0 }

    // hot favorite product: most ordered items by count
    const topProductAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' }, orders: { $sum: 1 } } },
      { $sort: { qty: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 0, productId: '$product._id', name: '$product.name', qty: 1, orders: 1 } },
    ])
    const hotFavoriteProduct = topProductAgg[0] || null

    res.json({
      totals: {
        totalOrders,
        totalPendingOrders: pendingOrders,
        totalCancelledOrders: cancelledOrders,
        totalCashOnDeliveryOrders: codOrders,
        totalOnTimeDeliveredOrders: ontime,
        totalDelayedOrders: delayed,
        totalComplaints: complaintsTotal,
        staffComplaints,
        productComplaints,
      },
      satisfaction,
      hotFavoriteProduct,
    })
  } catch (err) { next(err) }
}

module.exports.orderManagementStats = orderManagementStats
