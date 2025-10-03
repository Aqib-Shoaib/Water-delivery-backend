const { Resignation } = require('../models/Resignation');

async function list(req, res, next) { try { const { user } = req.query; const q = user ? { user } : {}; res.json(await Resignation.find(q).sort({ date: -1 }).limit(1000)); } catch(e){ next(e) } }
async function create(req, res, next) { try { const { user, date, reason, finalSettlement=0, fileUrl } = req.body||{}; if(!user) return res.status(400).json({message:'user required'}); const doc = await Resignation.create({ user, date, reason, finalSettlement, fileUrl }); res.status(201).json(doc); } catch(e){ next(e) } }
async function remove(req, res, next) { try { const { id } = req.params; await Resignation.findByIdAndDelete(id); res.json({success:true}); } catch(e){ next(e) } }

module.exports = { list, create, remove };
