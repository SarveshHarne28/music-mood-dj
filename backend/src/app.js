require('dotenv').config();
const express = require('express');
const cors = require('cors');

const tracksRouter = require('./routes/tracks');
const mixesRouter = require('./routes/mixes');
const statsRouter = require('./routes/stats');

const app = express();
app.use(express.json());

const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const allowed = raw.split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowed.length === 0) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'), false);
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use('/api/tracks', tracksRouter);
app.use('/api/mixes', mixesRouter);
app.use('/api/stats', statsRouter);

app.get('/', (req, res) => res.json({ ok: true, message: 'Music Mood DJ backend' }));

module.exports = app;
