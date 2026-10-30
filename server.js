'use strict';
const express = require('express');
const fs = require('fs');
const path = require('path');
const DEFAULT_DATA_FILE = path.join(__dirname, 'data.json');

function createApp(options = {}) {
  const app = express();
  const dataFile = options.dataFile || DEFAULT_DATA_FILE;
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) app.use(express.static(publicDir));

  function readIndicators() {
    if (!fs.existsSync(dataFile)) return [];
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('Indicators must be a JSON array');
    return parsed;
  }
  app.get('/api/indicators', (req, res) => {
    try { res.json(readIndicators()); }
    catch (error) {
      console.error('Failed to read indicators:', error.message);
      res.status(500).json({ error: 'Unable to read indicators' });
    }
  });
  app.post('/api/indicators', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'A JSON object is required' });
    }
    const { date, inflacion, pbi, tipoCambioOficial } = body;
    const dateValid = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(date + 'T00:00:00Z')) &&
      new Date(date + 'T00:00:00Z').toISOString().startsWith(date + 'T');
    if (!dateValid) return res.status(400).json({ error: 'date must be valid YYYY-MM-DD' });
    for (const [name, value] of Object.entries({ inflacion, pbi, tipoCambioOficial })) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return res.status(400).json({ error: name + ' must be a finite JSON number' });
      }
    }
    if (tipoCambioOficial <= 0) return res.status(400).json({ error: 'tipoCambioOficial must be positive' });
    try {
      const dataset = readIndicators().filter(record => record.date !== date);
      const newItem = { date, inflacion, pbi, tipoCambioOficial };
      dataset.push(newItem);
      dataset.sort((a, b) => String(a.date).localeCompare(String(b.date)));
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      const tempFile = dataFile + '.' + process.pid + '.' + Date.now() + '.tmp';
      try {
        fs.writeFileSync(tempFile, JSON.stringify(dataset, null, 2), { encoding: 'utf8', flag: 'wx' });
        fs.renameSync(tempFile, dataFile);
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }
      res.json({ success: true, data: newItem });
    } catch (error) {
      console.error('Failed to save indicator:', error.message);
      res.status(500).json({ error: 'Unable to save indicator' });
    }
  });
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    next(error);
  });
  return app;
}
if (require.main === module) {
  const port = Number(process.env.PORT || 4000);
  createApp().listen(port, () => console.log('RiskControl API listening on ' + port));
}
module.exports = { createApp };
