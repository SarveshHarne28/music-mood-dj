require('dotenv').config();
const express = require('express');
const cors = require('cors');

const tracksRouter = require('./routes/tracks');
const mixesRouter = require('./routes/mixes');
const statsRouter = require('./routes/stats');

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

app.use('/api/tracks', tracksRouter);
app.use('/api/mixes', mixesRouter);
app.use('/api/stats', statsRouter);

app.get('/', (req, res) => res.json({ ok: true, message: 'Music Mood DJ backend' }));

module.exports = app;
