import axios from 'axios';
import NodeCache from 'node-cache';
import { TMDBService, tmdbService } from '../services/tmdbService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock NodeCache
jest.mock('node-cache');
const MockedNodeCache = NodeCache as jest.MockedClass<typeof NodeCache>;

describe('TMDBService', () => {
  let tmdbService: TMDBService;
  let mockCache: jest.Mocked<NodeCache>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock environment variable
    process.env.TMDB_API_KEY = 'test-api-key';

    // Create mock cache instance
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        keys: 0,
        hits: 0,
        misses: 0,
        ksize: 0,
        vsize: 0,
      }),
    } as any;

    MockedNodeCache.mockImplementation(() => mockCache);

    // Create mock axios instance
    const mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
      },
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create service instance
    tmdbService = new TMDBService();
  });

  describe('constructor', () => {
    it('should throw error if TMDB_API_KEY is not set', () => {
      delete process.env.TMDB_API_KEY;
      expect(() => new TMDBService()).toThrow('TMDB_API_KEY environment variable is required');
    });

    it('should create service with valid API key', () => {
      process.env.TMDB_API_KEY = 'test-key';
      expect(() => new TMDBService()).not.toThrow();
    });
  });

  describe('searchMulti', () => {
    const mockSearchResponse = {
      data: {
        page: 1,
        results: [
          {
            id: 123,
            title: 'Test Movie',
            overview: 'A test movie',
            poster_path: '/test.jpg',
            backdrop_path: '/backdrop.jpg',
            release_date: '2023-01-01',
            vote_average: 8.5,
            genre_ids: [1, 2],
          },
          {
            id: 456,
            name: 'Test TV Show',
            overview: 'A test TV show',
            poster_path: '/test-tv.jpg',
            backdrop_path: '/backdrop-tv.jpg',
            first_air_date: '2023-01-01',
            vote_average: 9.0,
            genre_ids: [3, 4],
          },
        ],
        total_results: 2,
        total_pages: 1,
      },
    };

    it('should search for media successfully', async () => {
      const mockGet = jest.fn().mockResolvedValue(mockSearchResponse);
      (tmdbService as any).client.get = mockGet;

      const result = await tmdbService.searchMulti('test query');

      expect(mockGet).toHaveBeenCalledWith('/search/multi', {
        query: 'test query',
        page: 1,
        include_adult: false,
      });
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toHaveProperty('media_type', 'movie');
      expect(result.results[1]).toHaveProperty('media_type', 'tv');
    });

    it('should return cached results when available', async () => {
      mockCache.get.mockReturnValue(mockSearchResponse.data);

      const result = await tmdbService.searchMulti('test query');

      expect(mockCache.get).toHaveBeenCalled();
      expect(result).toEqual(mockSearchResponse.data);
    });

    it('should cache results after successful API call', async () => {
      const mockGet = jest.fn().mockResolvedValue(mockSearchResponse);
      (tmdbService as any).client.get = mockGet;

      await tmdbService.searchMulti('test query');

      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should throw error for empty query', async () => {
      await expect(tmdbService.searchMulti('')).rejects.toThrow('Search query cannot be empty');
      await expect(tmdbService.searchMulti('   ')).rejects.toThrow('Search query cannot be empty');
    });

    it('should handle API errors gracefully', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('API Error'));
      (tmdbService as any).client.get = mockGet;

      await expect(tmdbService.searchMulti('test query')).rejects.toThrow('API Error');
    });

    it('should handle TMDB API error responses', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        response: {
          data: {
            status_message: 'Invalid API key',
            status_code: 401,
          },
        },
      });
      (tmdbService as any).client.get = mockGet;

      await expect(tmdbService.searchMulti('test query')).rejects.toThrow('TMDB API Error: Invalid API key (401)');
    });
  });

  describe('getMovieDetails', () => {
    const mockMovieDetails = {
      id: 123,
      title: 'Test Movie',
      overview: 'A test movie',
      poster_path: '/test.jpg',
      backdrop_path: '/backdrop.jpg',
      release_date: '2023-01-01',
      vote_average: 8.5,
      genre_ids: [1, 2],
      genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Drama' }],
    };

    const mockWatchProviders = {
      results: {
        US: {
          flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }],
        },
      },
    };

    it('should get movie details successfully', async () => {
      const mockGet = jest.fn()
        .mockResolvedValueOnce({ data: mockMovieDetails })
        .mockResolvedValueOnce({ data: mockWatchProviders });
      (tmdbService as any).client.get = mockGet;

      const result = await tmdbService.getMovieDetails(123);

      expect(mockGet).toHaveBeenCalledWith('/movie/123', { append_to_response: 'genres' });
      expect(mockGet).toHaveBeenCalledWith('/movie/123/watch/providers', {});
      expect(result.id).toBe(123);
      expect(result.title).toBe('Test Movie');
      expect(result.media_type).toBe('movie');
      expect(result.watch_providers).toEqual(mockWatchProviders);
    });

    it('should cache movie details', async () => {
      const mockGet = jest.fn()
        .mockResolvedValueOnce({ data: mockMovieDetails })
        .mockResolvedValueOnce({ data: mockWatchProviders });
      (tmdbService as any).client.get = mockGet;

      await tmdbService.getMovieDetails(123);

      expect(mockCache.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTVDetails', () => {
    const mockTVDetails = {
      id: 456,
      name: 'Test TV Show',
      overview: 'A test TV show',
      poster_path: '/test-tv.jpg',
      backdrop_path: '/backdrop-tv.jpg',
      first_air_date: '2023-01-01',
      vote_average: 9.0,
      genre_ids: [3, 4],
      genres: [{ id: 3, name: 'Comedy' }, { id: 4, name: 'Sci-Fi' }],
      number_of_seasons: 3,
      number_of_episodes: 24,
    };

    const mockWatchProviders = {
      results: {
        US: {
          flatrate: [{ provider_id: 9, provider_name: 'Hulu', logo_path: '/hulu.jpg' }],
        },
      },
    };

    it('should get TV show details successfully', async () => {
      const mockGet = jest.fn()
        .mockResolvedValueOnce({ data: mockTVDetails })
        .mockResolvedValueOnce({ data: mockWatchProviders });
      (tmdbService as any).client.get = mockGet;

      const result = await tmdbService.getTVDetails(456);

      expect(mockGet).toHaveBeenCalledWith('/tv/456', { append_to_response: 'genres' });
      expect(mockGet).toHaveBeenCalledWith('/tv/456/watch/providers', {});
      expect(result.id).toBe(456);
      expect(result.title).toBe('Test TV Show');
      expect(result.media_type).toBe('tv');
      expect(result.watch_providers).toEqual(mockWatchProviders);
    });

    it('should transform TV show data correctly', async () => {
      const mockGet = jest.fn()
        .mockResolvedValueOnce({ data: mockTVDetails })
        .mockResolvedValueOnce({ data: mockWatchProviders });
      (tmdbService as any).client.get = mockGet;

      const result = await tmdbService.getTVDetails(456);

      expect(result.release_date).toBe(mockTVDetails.first_air_date);
      expect(result.number_of_seasons).toBe(3);
      expect(result.number_of_episodes).toBe(24);
    });
  });

  describe('getMediaDetails', () => {
    it('should call getMovieDetails for movie type', async () => {
      const spy = jest.spyOn(tmdbService, 'getMovieDetails');
      spy.mockResolvedValue({} as any);

      await tmdbService.getMediaDetails(123, 'movie');

      expect(spy).toHaveBeenCalledWith(123);
    });

    it('should call getTVDetails for TV type', async () => {
      const spy = jest.spyOn(tmdbService, 'getTVDetails');
      spy.mockResolvedValue({} as any);

      await tmdbService.getMediaDetails(456, 'tv');

      expect(spy).toHaveBeenCalledWith(456);
    });

    it('should throw error for invalid media type', async () => {
      await expect(tmdbService.getMediaDetails(123, 'invalid' as any)).rejects.toThrow('Invalid media type: invalid');
    });
  });

  describe('getGenres', () => {
    const mockGenresResponse = {
      genres: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Drama' },
        { id: 3, name: 'Comedy' },
      ],
    };

    it('should get movie genres successfully', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockGenresResponse });
      (tmdbService as any).client.get = mockGet;

      const result = await tmdbService.getGenres('movie');

      expect(mockGet).toHaveBeenCalledWith('/genre/movie/list', {});
      expect(result).toEqual(mockGenresResponse.genres);
    });

    it('should get TV genres successfully', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockGenresResponse });
      (tmdbService as any).client.get = mockGet;

      const result = await tmdbService.getGenres('tv');

      expect(mockGet).toHaveBeenCalledWith('/genre/tv/list', {});
      expect(result).toEqual(mockGenresResponse.genres);
    });

    it('should cache genres for longer period', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockGenresResponse });
      (tmdbService as any).client.get = mockGet;

      await tmdbService.getGenres('movie');

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        mockGenresResponse,
        86400 // 24 hours
      );
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      tmdbService.clearCache();
      expect(mockCache.flushAll).toHaveBeenCalled();
    });

    it('should delete specific cache key', () => {
      tmdbService.deleteCacheKey('test-key');
      expect(mockCache.del).toHaveBeenCalledWith('test-key');
    });

    it('should get cache stats', () => {
      const stats = tmdbService.getCacheStats();
      expect(mockCache.getStats).toHaveBeenCalled();
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
    });

    it('should get from cache only when available', async () => {
      const testData = { test: 'data' };
      mockCache.get.mockReturnValue(testData);

      const result = await tmdbService.getFromCacheOnly('test-key');

      expect(mockCache.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(testData);
    });

    it('should return null when cache miss', async () => {
      mockCache.get.mockReturnValue(undefined);

      const result = await tmdbService.getFromCacheOnly('test-key');

      expect(result).toBeNull();
    });
  });

  describe('rate limiting', () => {
    it('should set up rate limiting interceptor', () => {
      const mockInstance = {
        interceptors: {
          request: {
            use: jest.fn(),
          },
        },
        get: jest.fn(),
      };

      mockedAxios.create.mockReturnValue(mockInstance);
      new TMDBService();

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent cache keys', () => {
      const key1 = (tmdbService as any).getCacheKey('/test', { param1: 'value1', param2: 'value2' });
      const key2 = (tmdbService as any).getCacheKey('/test', { param2: 'value2', param1: 'value1' });
      
      expect(key1).toBe(key2);
      expect(key1).toBe('/test?param1=value1&param2=value2');
    });

    it('should handle empty parameters', () => {
      const key = (tmdbService as any).getCacheKey('/test', {});
      expect(key).toBe('/test');
    });
  });
});

describe('tmdbService singleton', () => {
  it('should export a singleton instance', () => {
    expect(tmdbService).toBeInstanceOf(TMDBService);
  });
});