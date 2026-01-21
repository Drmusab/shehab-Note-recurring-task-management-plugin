import type { QueryResult } from "@/core/query/QueryEngine";

export interface InlineQueryCacheEntry {
  result: QueryResult;
  updatedAt: number;
  lastAccessedAt: number;
}

export interface InlineQueryCacheMetrics {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

export class InlineQueryCache {
  private cache = new Map<string, InlineQueryCacheEntry>();
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
  private maxSize: number;

  constructor(
    private ttlMs: number = 60_000,
    maxSize: number = 100
  ) {
    this.maxSize = maxSize;
  }

  buildKey(query: string, settingsHash: string): string {
    return `${query}::${settingsHash}`;
  }

  get(key: string): InlineQueryCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }
    if (this.ttlMs > 0 && Date.now() - entry.updatedAt > this.ttlMs) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }
    // Update last accessed time for LRU tracking
    entry.lastAccessedAt = Date.now();
    this.metrics.hits++;
    return entry;
  }

  set(key: string, result: QueryResult): void {
    // If cache is at max size, evict least recently used entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const now = Date.now();
    this.cache.set(key, {
      result,
      updatedAt: now,
      lastAccessedAt: now,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Evicts the least recently used entry from the cache
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  /**
   * Returns cache metrics for monitoring
   */
  getMetrics(): InlineQueryCacheMetrics {
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      size: this.cache.size,
      evictions: this.metrics.evictions,
    };
  }

  /**
   * Resets cache metrics
   */
  resetMetrics(): void {
    this.metrics.hits = 0;
    this.metrics.misses = 0;
    this.metrics.evictions = 0;
  }
}
