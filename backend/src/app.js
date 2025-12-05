require('dotenv').config();
const express = require('express');
const cors = require('cors');

const tracksRouter = require('./routes/tracks');
const mixesRouter = require('./routes/mixes');
const statsRouter = require('./routes/stats');

const app = express();
app.use(express.json());

if (process.env.ALLOW_ALL_ORIGINS === '1') {
  console.log('CORS: Allowing all origins (EMERGENCY MODE)');
  app.use(cors());
} else {
  const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
  const allowed = raw.split(',').map(s => s.trim()).filter(Boolean);
  console.log('Allowed CORS origins:', allowed);

  const corsOptions = {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowed.length === 0) return callback(null, true); 
      if (allowed.includes(origin)) return callback(null, true);
      console.log('Blocked CORS origin:', origin);
      return callback(new Error('CORS: Not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
}

app.use('/api/tracks', tracksRouter);
app.use('/api/mixes', mixesRouter);
app.use('/api/stats', statsRouter);

app.get('/', (req, res) => res.send('Backend OK'));
module.exports = app;
