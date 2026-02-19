import { describe, it, expect } from 'vitest';
import { buildCacheKey, getCached, setCache, cache } from '../services/cache';

describe('Cache Utilities', () => {
  it('should build consistent cache keys', () => {
    const key1 = buildCacheKey('summary', {
      from: '2026-01-01',
      to: '2026-01-31',
      page: 1,
      limit: 20,
    });
    const key2 = buildCacheKey('summary', {
      to: '2026-01-31',
      from: '2026-01-01',
      limit: 20,
      page: 1,
    });
    expect(key1).toBe(key2); // Order independent
  });

  it('should exclude undefined values from cache key', () => {
    const key = buildCacheKey('summary', { from: '2026-01-01', to: undefined, page: 1, limit: 20 });
    expect(key).not.toContain('to=');
  });

  it('should store and retrieve cached values', () => {
    cache.flushAll();
    const data = { totalRevenue: 1000 };
    setCache('test-key', data);
    const retrieved = getCached<typeof data>('test-key');
    expect(retrieved).toEqual(data);
  });

  it('should return undefined for missing cache keys', () => {
    cache.flushAll();
    const result = getCached('nonexistent');
    expect(result).toBeUndefined();
  });
});
