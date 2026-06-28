/**
 * Session-level AI Response Cache
 *
 * Caches AI responses in memory for the duration of the browser session.
 * Same prompt + model = instant return, zero Gemini quota consumed.
 *
 * Cache key: lightweight hash of (model + serialized contents)
 * TTL: 30 minutes per entry (resets on cache hit to keep hot entries alive)
 */

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  value: any;
  expiresAt: number;
}

// Module-level map — persists for the entire browser session (tab lifetime)
const _cache = new Map<string, CacheEntry>();

/**
 * Fast, non-cryptographic string hash (djb2 variant).
 * Good enough for cache key collision avoidance.
 */
function hashKey(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  // Return as unsigned 32-bit hex string
  return (h >>> 0).toString(16);
}

/**
 * Build a cache key from model name + prompt contents.
 * Contents can be a string or array of content objects.
 */
function buildCacheKey(model: string, contents: any): string {
  const raw = model + '::' + (typeof contents === 'string' ? contents : JSON.stringify(contents));
  return hashKey(raw);
}

/**
 * Retrieve a cached AI response.
 * Returns null on cache miss or expired entry.
 */
export function getCachedAIResponse(model: string, contents: any): any | null {
  const key = buildCacheKey(model, contents);
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  // Refresh TTL on hit to keep active entries warm
  entry.expiresAt = Date.now() + SESSION_TTL_MS;
  return entry.value;
}

/**
 * Store an AI response in the session cache.
 */
export function setCachedAIResponse(model: string, contents: any, value: any): void {
  const key = buildCacheKey(model, contents);
  _cache.set(key, {
    value,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

/**
 * Clear the entire AI cache.
 * Call on logout or user data reset so stale data isn't served to a different user.
 */
export function clearAICache(): void {
  _cache.clear();
}

/**
 * Returns current cache stats for debugging.
 */
export function getAICacheStats(): { size: number; keys: string[] } {
  return { size: _cache.size, keys: Array.from(_cache.keys()) };
}
