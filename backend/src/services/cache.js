const IORedis = require('ioredis');

let redis = null;
const fallbackCache = {}; // { key: { value, expiryTs } }

if (process.env.REDIS_URL) {
  try {
    redis = new IORedis(process.env.REDIS_URL);
    redis.on('error', (err) => {
      console.warn('Redis connection error - falling back to in-memory cache', err.message);
      redis = null;
    });
  } catch (e) {
    console.warn('Redis init failed, using fallback cache', e.message);
    redis = null;
  }
}

async function get(key) {
  if (redis) {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  }
  const entry = fallbackCache[key];
  if (!entry) return null;
  if (Date.now() > entry.expiryTs) {
    delete fallbackCache[key];
    return null;
  }
  return entry.value;
}

async function set(key, value, ttlSeconds = 60) {
  if (redis) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return;
  }
  fallbackCache[key] = { value, expiryTs: Date.now() + ttlSeconds * 1000 };
}

async function del(key) {
  if (redis) {
    await redis.del(key);
    return;
  }
  delete fallbackCache[key];
}

module.exports = { get, set, del };
