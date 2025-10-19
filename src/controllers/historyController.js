const { Order } = require('../models/Order');
const { User } = require('../models/User');
const { Asset } = require('../models/Asset');

function parseRange(query){
  const now = new Date();
  let from, to;
  switch ((query.range||'month').toLowerCase()){
    case 'day':
      to = now; from = new Date(now.getTime()-24*60*60*1000); break;
    case 'week':
      to = now; from = new Date(now.getTime()-7*24*60*60*1000); break;
    case 'month':
      to = now; from = new Date(now.getTime()-30*24*60*60*1000); break;
    case 'year':
      to = now; from = new Date(now.getTime()-365*24*60*60*1000); break;
    case 'custom':
      from = query.from ? new Date(query.from) : null;
      to = query.to ? new Date(query.to) : null;
      break;
    default:
      to = now; from = new Date(now.getTime()-30*24*60*60*1000);
  }
  return { from, to };
}

exports.summary = async (req, res) => {
  try {
    const { from, to } = parseRange(req.query);
    const dateFilter = {};
    if (from) dateFilter.$gte = from;
    if (to) dateFilter.$lte = to;

    // Orders filters by createdAt/deliveredAt for revenue
    const orderMatch = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    const paidMatch = Object.keys(dateFilter).length ? { createdAt: dateFilter, paymentStatus: 'paid' } : { paymentStatus: 'paid' };

    const [completedOrders, pendingOrders, cancelledOrders, codOrders, revenueAgg] = await Promise.all([
      Order.countDocuments({ ...orderMatch, status: 'delivered' }),
      Order.countDocuments({ ...orderMatch, status: { $in: ['placed','pending_payment','assigned','driver_assigned','en_route'] } }),
      Order.countDocuments({ ...orderMatch, status: { $in: ['cancelled','failed'] } }),
      Order.countDocuments({ ...orderMatch, paymentMethod: 'cod' }),
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ])
    ]);

    // Users (employees and clients)
    const fifteenDaysAgo = new Date(Date.now() - 15*24*60*60*1000);
    const [clients, newClients, discontinuedClients, workingEmployees, rejectedEmployees, terminatedEmployees, waitingEmployees] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: fifteenDaysAgo } }),
      Promise.resolve(0), // Not modeled yet
      User.countDocuments({ role: { $in: ['admin','driver'] }, status: 'working' }),
      Promise.resolve(0), // Not modeled yet
      User.countDocuments({ role: { $in: ['admin','driver'] }, status: 'terminated' }),
      User.countDocuments({ role: { $in: ['admin','driver'] }, status: 'waiting' }),
    ]);

    // Assets (dispensers/bottles)
    const [inHandDispensers, outHandDispensers, damagedDispensers, inboundBottles, outboundBottles, suppliersAgg] = await Promise.all([
      Asset.countDocuments({ itemType: /dispenser/i, itemCondition: /in-hand/i }),
      Asset.countDocuments({ itemType: /dispenser/i, itemCondition: /out-bound/i }),
      Asset.countDocuments({ itemType: /dispenser/i, itemCondition: /damaged/i }),
      Asset.countDocuments({ itemType: /bottle/i, itemCondition: /in-bound/i }),
      Asset.countDocuments({ itemType: /bottle/i, itemCondition: /out-bound/i }),
      Asset.aggregate([
        { $match: { vendorName: { $exists: true, $ne: '' } } },
        { $group: { _id: '$vendorName' } },
        { $count: 'vendors' },
      ])
    ]);

    const suppliers = (suppliersAgg[0]?.vendors) || 0;
    const revenue = revenueAgg[0]?.total || 0;

    return res.json({
      completedOrders,
      pendingOrders,
      cancelledOrders,
      codOrders,
      inHandDispensers,
      outHandDispensers,
      damagedDispensers,
      clients,
      newClients,
      discontinuedClients,
      inboundBottles,
      outboundBottles,
      suppliers,
      workingEmployees,
      rejectedEmployees,
      terminatedEmployees,
      waitingEmployees,
      revenue,
    });
  } catch (err) {
    console.error('history summary error:', err);
    return res.status(500).json({ message: 'Failed to load history summary' });
  }
};
