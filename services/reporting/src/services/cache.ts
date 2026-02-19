import NodeCache from 'node-cache';

// TTL of 60 seconds for cached query results
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCache<T>(key: string, value: T): void {
  cache.set(key, value);
}

export function buildCacheKey(
  prefix: string,
  params: Record<string, string | number | undefined>,
): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${prefix}:${sorted}`;
}

export { cache };
