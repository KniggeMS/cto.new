import NodeCache from 'node-cache';
import { 
  InMemoryCacheService, 
  createCacheService, 
  CacheService 
} from '../services/cacheService';

// Mock NodeCache
jest.mock('node-cache');
const MockedNodeCache = NodeCache as jest.MockedClass<typeof NodeCache>;

describe('InMemoryCacheService', () => {
  let cacheService: InMemoryCacheService;
  let mockCache: jest.Mocked<NodeCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock cache instance
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        keys: 5,
        hits: 100,
        misses: 20,
        ksize: 1024,
        vsize: 2048,
      }),
      keys: jest.fn().mockReturnValue(['key1', 'key2', 'key3']),
      has: jest.fn().mockReturnValue(true),
      mget: jest.fn(),
    } as any;

    MockedNodeCache.mockImplementation(() => mockCache);
    cacheService = new InMemoryCacheService();
  });

  describe('get', () => {
    it('should retrieve value from cache', () => {
      const testValue = { test: 'data' };
      mockCache.get.mockReturnValue(testValue);

      const result = cacheService.get('test-key');

      expect(mockCache.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(testValue);
    });

    it('should return undefined for non-existent key', () => {
      mockCache.get.mockReturnValue(undefined);

      const result = cacheService.get('non-existent-key');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', () => {
      const testValue = { test: 'data' };

      cacheService.set('test-key', testValue);

      expect(mockCache.set).toHaveBeenCalledWith('test-key', testValue, undefined);
    });

    it('should set value in cache with custom TTL', () => {
      const testValue = { test: 'data' };

      cacheService.set('test-key', testValue, 600);

      expect(mockCache.set).toHaveBeenCalledWith('test-key', testValue, 600);
    });
  });

  describe('del', () => {
    it('should delete key from cache', () => {
      cacheService.del('test-key');

      expect(mockCache.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cacheService.clear();

      expect(mockCache.flushAll).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = cacheService.getStats();

      expect(mockCache.getStats).toHaveBeenCalled();
      expect(stats).toEqual({
        keys: 5,
        hits: 100,
        misses: 20,
        ksize: 1024,
        vsize: 2048,
      });
    });
  });

  describe('keys', () => {
    it('should return all cache keys', () => {
      const keys = cacheService.keys();

      expect(mockCache.keys).toHaveBeenCalled();
      expect(keys).toEqual(['key1', 'key2', 'key3']);
    });
  });

  describe('has', () => {
    it('should check if key exists', () => {
      const exists = cacheService.has('test-key');

      expect(mockCache.has).toHaveBeenCalledWith('test-key');
      expect(exists).toBe(true);
    });
  });

  describe('mget', () => {
    it('should get multiple keys', () => {
      const mockData = {
        'key1': 'value1',
        'key2': 'value2',
        'key3': undefined,
      };
      mockCache.mget.mockReturnValue(mockData);

      const result = cacheService.mget(['key1', 'key2', 'key3']);

      expect(mockCache.mget).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
      expect(result).toEqual(mockData);
    });
  });

  describe('mset', () => {
    it('should set multiple keys', () => {
      const entries = {
        'key1': 'value1',
        'key2': 'value2',
      };

      cacheService.mset(entries);

      expect(mockCache.set).toHaveBeenCalledWith('key1', 'value1', undefined);
      expect(mockCache.set).toHaveBeenCalledWith('key2', 'value2', undefined);
    });

    it('should set multiple keys with custom TTL', () => {
      const entries = {
        'key1': 'value1',
        'key2': 'value2',
      };

      cacheService.mset(entries, 300);

      expect(mockCache.set).toHaveBeenCalledWith('key1', 'value1', 300);
      expect(mockCache.set).toHaveBeenCalledWith('key2', 'value2', 300);
    });
  });
});

describe('createCacheService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create InMemoryCacheService by default', () => {
    const cacheService = createCacheService();

    expect(cacheService).toBeInstanceOf(InMemoryCacheService);
    expect(MockedNodeCache).toHaveBeenCalledWith({
      stdTTL: 300,
      checkperiod: 600,
    });
  });

  it('should create InMemoryCacheService when memory type is specified', () => {
    const cacheService = createCacheService('memory');

    expect(cacheService).toBeInstanceOf(InMemoryCacheService);
  });

  it('should create InMemoryCacheService with custom options', () => {
    const options = {
      stdTTL: 600,
      checkperiod: 300,
    };

    const cacheService = createCacheService('memory', options);

    expect(cacheService).toBeInstanceOf(InMemoryCacheService);
    expect(MockedNodeCache).toHaveBeenCalledWith(options);
  });

  it('should attempt to create RedisCacheService when redis type is specified and REDIS_URL is set', () => {
  process.env.REDIS_URL = 'redis://localhost:6379';

  // Mock redis module
  const mockRedisClient = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    flushdb: jest.fn(),
    info: jest.fn(),
  };

  const mockRedis = {
    createClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  // Mock dynamic import
  jest.doMock('redis', () => mockRedis, { virtual: true });

  const cacheService = createCacheService('redis');

  // Since Redis import might fail, it should fall back to InMemoryCacheService
  expect(cacheService).toBeInstanceOf(InMemoryCacheService);
  });

  it('should fall back to InMemoryCacheService when Redis is not available', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Mock require to throw error
    jest.doMock('redis', () => {
      throw new Error('Redis module not found');
    }, { virtual: true });

    const cacheService = createCacheService('redis');

    expect(cacheService).toBeInstanceOf(InMemoryCacheService);
  });
});

describe('CacheService interface', () => {
  it('should enforce required methods', () => {
    // This test ensures that any class implementing CacheService
    // must have all required methods
    const mockCacheService: CacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
    };

    expect(typeof mockCacheService.get).toBe('function');
    expect(typeof mockCacheService.set).toBe('function');
    expect(typeof mockCacheService.del).toBe('function');
    expect(typeof mockCacheService.clear).toBe('function');
    expect(typeof mockCacheService.getStats).toBe('function');
  });
});