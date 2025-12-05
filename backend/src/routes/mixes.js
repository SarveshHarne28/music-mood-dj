const express = require('express');
const db = require('../services/db');
const cache = require('../services/cache');
const llm = require('../services/llm');

const router = express.Router();

async function loadAllTracks() {
  const q = await db.query('SELECT id, original_name, duration_seconds FROM tracks');
  return q.rows;
}

router.post('/generate', async (req, res) => {
  try {
    const { mood, prompt, maxTracks = 5 } = req.body;
    if (!mood) return res.status(400).json({ error: 'mood is required' });

    const allTracks = await loadAllTracks();
    if (!allTracks || allTracks.length === 0) return res.status(400).json({ error: 'No tracks available' });

    const result = await llm.generatePlaylist({ mood, prompt, tracks: allTracks, maxTracks });
    const playlist = result.playlist || [];

    if (!playlist || playlist.length === 0) return res.status(500).json({ error: 'Failed to generate playlist' });

    const validTrackIds = new Set(allTracks.map(t => String(t.id)));
    const finalItems = playlist.filter(p => validTrackIds.has(String(p.id))).slice(0,6);

    if (finalItems.length === 0) return res.status(500).json({ error: 'No valid tracks selected' });

    const mixInsert = await db.query(
      `INSERT INTO mixes (mood, prompt, generated_by) VALUES ($1,$2,$3) RETURNING id, mood, prompt, created_at`,
      [mood, prompt || null, process.env.LLM_PROVIDER || 'fallback']
    );
    const mix = mixInsert.rows[0];

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of finalItems) {
        await client.query(
          `INSERT INTO mix_items (mix_id, track_id, position, weight) VALUES ($1,$2,$3,$4)`,
          [mix.id, item.id, item.position, item.weight]
        );
        await client.query(`UPDATE tracks SET selected_count = selected_count + 1 WHERE id = $1`, [item.id]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await cache.del('top_tracks:10');

    const host = `${req.protocol}://${req.get('host')}`;
    const items = finalItems.map((t, idx) => ({
      trackId: t.id,
      position: idx + 1,
      weight: t.weight,
      title: allTracks.find(a => String(a.id) === String(t.id)).original_name,
      url: `${host}/api/tracks/${t.id}/file`
    }));

    res.json({ ok: true, mix: { ...mix, items } });
  } catch (err) {
    console.error('Generate mix error:', err);
    res.status(500).json({ error: 'Generate failed' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const mixQ = await db.query('SELECT id, mood, prompt, generated_by, created_at FROM mixes WHERE id = $1', [id]);
  if (!mixQ.rows[0]) return res.status(404).json({ error: 'Mix not found' });
  const mix = mixQ.rows[0];

  const itemsQ = await db.query(
    `SELECT mi.track_id, mi.position, mi.weight, t.original_name
     FROM mix_items mi
     JOIN tracks t ON t.id = mi.track_id
     WHERE mi.mix_id = $1
     ORDER BY mi.position ASC`, [id]
  );

  const host = `${req.protocol}://${req.get('host')}`;
  const items = itemsQ.rows.map(r => ({ trackId: r.track_id, position: r.position, weight: r.weight, title: r.original_name, url: `${host}/api/tracks/${r.track_id}/file` }));

  res.json({ ok: true, mix: { ...mix, items } });
});

router.get('/', async (req, res) => {
  const rows = await db.query('SELECT id, mood, prompt, generated_by, created_at FROM mixes ORDER BY created_at DESC LIMIT 100');
  res.json({ ok: true, mixes: rows.rows });
});

module.exports = router;
