require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const r = await pool.query('SELECT count(*) FROM tracks;');
    console.log('OK, tracks count =', r.rows[0].count);
  } catch (e) {
    console.error('DB test error:', e);
  } finally {
    await pool.end();
  }
})();
