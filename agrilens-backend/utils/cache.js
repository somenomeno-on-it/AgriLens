/**
 * Simple in-memory cache utility.
 * Stores entries with a TTL; expired entries are recomputed on next access.
 *
 * Usage:
 *   const cache = require("../utils/cache");
 *   const data = await cache.getOrSet("my-key", 5 * 60 * 1000, async () => {
 *     return await heavyDbQuery();
 *   });
 */

const store = new Map(); // key → { data, expiresAt }

/**
 * Retrieve cached value or compute it if missing/expired.
 * @param {string} key - Cache key
 * @param {number} ttlMs - Time-to-live in milliseconds (default: 5 minutes)
 * @param {Function} computeFn - Async function that returns fresh data
 * @returns {Promise<any>} - Cached or freshly computed value
 */
async function getOrSet(key, ttlMs = 5 * 60 * 1000, computeFn) {
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  const data = await computeFn();
  store.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * Manually invalidate a cache key.
 * @param {string} key
 */
function invalidate(key) {
  store.delete(key);
}

/**
 * Clear all cached entries.
 */
function clear() {
  store.clear();
}

module.exports = { getOrSet, invalidate, clear };
