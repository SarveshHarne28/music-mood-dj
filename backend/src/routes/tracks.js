const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mm = require('music-metadata');
const db = require('../services/db');

const router = express.Router();

// Ensure uploads dir exists
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mp3'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    let duration = null;
    try {
      const meta = await mm.parseFile(file.path);
      duration = Math.round(meta.format.duration || 0);
    } catch (e) {
      // ignore metadata errors
    }

    const insert = await db.query(
      `INSERT INTO tracks (filename, original_name, duration_seconds, mime_type, size_bytes, selected_count)
       VALUES ($1,$2,$3,$4,$5,0) RETURNING id, filename, original_name, duration_seconds, mime_type, size_bytes`,
      [file.filename, file.originalname, duration, file.mimetype, file.size]
    );
    const created = insert.rows[0];

    const fileUrl = `${req.protocol}://${req.get('host')}/api/tracks/${created.id}/file`;

    res.json({ ok: true, track: { ...created, url: fileUrl } });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', async (req, res) => {
  const limit = Number(req.query.limit || 100);
  const rows = await db.query('SELECT id, filename, original_name, duration_seconds, selected_count FROM tracks ORDER BY created_at DESC LIMIT $1', [limit]);
  const host = `${req.protocol}://${req.get('host')}`;
  const tracks = rows.rows.map(r => ({ ...r, url: `${host}/api/tracks/${r.id}/file` }));
  res.json({ ok: true, tracks });
});

router.get('/:id/file', async (req, res) => {
  try {
    const id = req.params.id;
    const q = await db.query('SELECT filename, mime_type FROM tracks WHERE id = $1', [id]);
    if (!q.rows[0]) return res.status(404).json({ error: 'Not found' });
    const { filename, mime_type } = q.rows[0];
    const filepath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File missing on server' });

    const stat = fs.statSync(filepath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filepath, { start, end });
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime_type || 'audio/mpeg'
      };
      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mime_type || 'audio/mpeg'
      });
      fs.createReadStream(filepath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Streaming error' });
  }
});

module.exports = router;
