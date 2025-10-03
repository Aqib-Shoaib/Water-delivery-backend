const { DutyResumption } = require('../models/DutyResumption');

async function list(req, res, next) { try { const { user } = req.query; const q = user ? { user } : {}; res.json(await DutyResumption.find(q).sort({ date: -1 }).limit(1000)); } catch(e){ next(e) } }
async function create(req, res, next) { try { const { user, date, amount=0, note } = req.body||{}; if(!user) return res.status(400).json({message:'user required'}); const doc = await DutyResumption.create({ user, date, amount, note }); res.status(201).json(doc); } catch(e){ next(e) } }
async function remove(req, res, next) { try { const { id } = req.params; await DutyResumption.findByIdAndDelete(id); res.json({success:true}); } catch(e){ next(e) } }

module.exports = { list, create, remove };
