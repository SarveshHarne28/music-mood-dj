const express = require('express');
const db = require('../services/db');
const cache = require('../services/cache');

const router = express.Router();

router.get('/top-tracks', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const cacheKey = `top_tracks:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ ok: true, cached: true, tracks: cached });

    const q = await db.query(
      'SELECT id, original_name, selected_count FROM tracks ORDER BY selected_count DESC NULLS LAST LIMIT $1',
      [limit]
    );
    const rows = q.rows;

    await cache.set(cacheKey, rows, 120); // cache 2 minutes
    res.json({ ok: true, cached: false, tracks: rows });
  } catch (err) {
    console.error('Top tracks error:', err);
    res.status(500).json({ error: 'Stats failed' });
  }
});

module.exports = router;
