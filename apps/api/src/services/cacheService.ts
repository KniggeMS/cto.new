import NodeCache from 'node-cache';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
}

export abstract class CacheService {
  abstract get<T>(key: string): T | undefined;
  abstract set<T>(key: string, value: T, ttl?: number): void;
  abstract del(key: string): void;
  abstract clear(): void;
  abstract getStats(): CacheStats;
}

export class InMemoryCacheService extends CacheService {
  private cache: NodeCache;

  constructor(options: { stdTTL?: number; checkperiod?: number } = {}) {
    super();
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 300, // 5 minutes default
      checkperiod: options.checkperiod || 600, // 10 minutes
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl || 0);
  }

  del(key: string): void {
    this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }

  getStats(): CacheStats {
    return this.cache.getStats();
  }

  // Additional convenience methods
  keys(): string[] {
    return this.cache.keys();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Method to get multiple keys at once
  mget<T>(keys: string[]): Record<string, T | undefined> {
    return this.cache.mget<T>(keys);
  }

  // Method to set multiple keys at once
  mset<T>(entries: Record<string, T>, ttl?: number): void {
    Object.entries(entries).forEach(([key, value]) => {
      this.set(key, value, ttl);
    });
  }
}

// Redis cache service for production use (placeholder implementation)
export class RedisCacheService extends CacheService {
  private client: any; // Redis client
  private defaultTTL: number;

  constructor(redisClient: any, defaultTTL: number = 300) {
    super();
    this.client = redisClient;
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | undefined {
    try {
      const value = this.client.get(key);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.error('Redis get error:', error);
      return undefined;
    }
  }

  set<T>(key: string, value: T, ttl?: number): void {
    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      this.client.setex(key, expiry, serialized);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  del(key: string): void {
    try {
      this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  clear(): void {
    try {
      this.client.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  getStats(): CacheStats {
    try {
      // Parse Redis info to get stats (simplified)
      return {
        keys: 0, // Would need to parse keyspace info
        hits: 0,
        misses: 0,
        ksize: 0,
        vsize: 0,
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return {
        keys: 0,
        hits: 0,
        misses: 0,
        ksize: 0,
        vsize: 0,
      };
    }
  }
}

// Factory function to create appropriate cache service
export function createCacheService(type: 'memory' | 'redis' = 'memory', options?: any): CacheService {
  if (type === 'redis' && process.env.REDIS_URL) {
    // Import Redis dynamically to avoid dependency issues
    try {
      const Redis = require('redis');
      const client = Redis.createClient({
        url: process.env.REDIS_URL,
      });
      return new RedisCacheService(client, options?.defaultTTL);
    } catch (error) {
      console.warn('Redis not available, falling back to in-memory cache:', error);
    }
  }
  
  return new InMemoryCacheService(options);
}

// Default cache instance
export const cacheService = createCacheService('memory', {
  stdTTL: 300, // 5 minutes
  checkperiod: 600, // 10 minutes
});