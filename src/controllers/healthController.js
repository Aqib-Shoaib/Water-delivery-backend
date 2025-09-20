const health = (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

module.exports = { health };
