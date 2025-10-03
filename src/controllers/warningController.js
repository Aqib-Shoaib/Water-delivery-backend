const { WarningLetter } = require('../models/WarningLetter');

async function list(req, res, next) { try { const { user } = req.query; const q = user ? { user } : {}; res.json(await WarningLetter.find(q).sort({ date: -1 }).limit(1000)); } catch(e){ next(e) } }
async function create(req, res, next) { try { const { user, date, subject, description, fileUrl } = req.body||{}; if(!user) return res.status(400).json({message:'user required'}); const doc = await WarningLetter.create({ user, date, subject, description, fileUrl }); res.status(201).json(doc); } catch(e){ next(e) } }
async function remove(req, res, next) { try { const { id } = req.params; await WarningLetter.findByIdAndDelete(id); res.json({success:true}); } catch(e){ next(e) } }

module.exports = { list, create, remove };
