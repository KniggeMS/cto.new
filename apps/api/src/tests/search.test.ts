import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import { tmdbService } from '../services/tmdbService';
import { cacheService } from '../services/cacheService';

// Mock dependencies
jest.mock('../services/tmdbService');
jest.mock('../services/cacheService');
jest.mock('@prisma/client');

const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockPrisma = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('Search Routes', () => {
  let mockPrismaInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Prisma instance
    mockPrismaInstance = {
      mediaItem: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      watchlistEntry: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      streamingProvider: {
        create: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    mockPrisma.mockImplementation(() => mockPrismaInstance);
  });

  describe('GET /search', () => {
    const mockSearchResponse = {
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
          media_type: 'movie',
        },
        {
          id: 456,
          title: 'Test TV Show',
          overview: 'A test TV show',
          poster_path: '/test-tv.jpg',
          backdrop_path: '/backdrop-tv.jpg',
          release_date: '2023-01-01',
          vote_average: 9.0,
          genre_ids: [3, 4],
          media_type: 'tv',
        },
      ],
      total_results: 2,
      total_pages: 1,
    };

    it('should return search results successfully', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/search').query({ query: 'test query' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.totalResults).toBe(2);
      expect(response.body.cached).toBe(false);
      expect(mockTmdbService.searchMulti).toHaveBeenCalledWith('test query', 1);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const cachedResponse = {
        data: mockSearchResponse.results,
        page: mockSearchResponse.page,
        totalPages: mockSearchResponse.total_pages,
        totalResults: mockSearchResponse.total_results,
        cached: true,
      };
      mockCacheService.get.mockReturnValue(cachedResponse);

      const response = await request(app).get('/search').query({ query: 'test query' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedResponse);
      expect(mockTmdbService.searchMulti).not.toHaveBeenCalled();
    });

    it('should enrich results with database provider data', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);

      // Mock existing media item with providers
      mockPrismaInstance.mediaItem.findUnique
        .mockResolvedValueOnce({
          id: 'media-123',
          tmdbId: 123,
          streamingProviders: [
            {
              provider: 'netflix',
              regions: ['US', 'GB'],
            },
          ],
        })
        .mockResolvedValueOnce(null);

      const response = await request(app).get('/search').query({ query: 'test query' });

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('inDatabase', true);
      expect(response.body.data[0]).toHaveProperty('streamingProviders');
      expect(response.body.data[0]).toHaveProperty('posterPath');
      expect(response.body.data[0]).toHaveProperty('mediaType');
    });

    it('should handle pagination', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/search').query({ query: 'test query', page: 2 });

      expect(mockTmdbService.searchMulti).toHaveBeenCalledWith('test query', 2);
      expect(response.status).toBe(200);
    });

    it('should validate query parameters', async () => {
      const response = await request(app).get('/search').query({ query: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid query parameters');
    });

    it('should handle include_adult parameter', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/search')
        .query({ query: 'test query', include_adult: 'true' });

      expect(response.status).toBe(200);
    });

    it('should handle TMDB API errors', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockRejectedValue(new Error('TMDB API Error'));

      const response = await request(app).get('/search').query({ query: 'test query' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to perform search');
    });

    it('should return stale cache when TMDB is down', async () => {
      mockCacheService.get
        .mockReturnValueOnce(undefined) // First call for fresh cache
        .mockReturnValueOnce(mockSearchResponse); // Second call for stale cache

      mockTmdbService.searchMulti.mockRejectedValue(new Error('TMDB API Error'));

      const response = await request(app).get('/search').query({ query: 'test query' });

      expect(response.status).toBe(200);
      expect(response.body.stale).toBe(true);
      expect(response.body.warning).toContain('Using cached data');
      expect(response.body.data).toBeDefined();
      expect(response.body.page).toBeDefined();
    });

    it('should return normalized camelCase response', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/search').query({ query: 'test query' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      
      const movieResult = response.body.data.find((r: any) => r.media_type === 'movie');
      expect(movieResult).toHaveProperty('posterPath', '/test.jpg');
      expect(movieResult).toHaveProperty('backdropPath', '/backdrop.jpg');
      expect(movieResult).toHaveProperty('releaseDate', '2023-01-01');
      expect(movieResult).toHaveProperty('voteAverage', 8.5);
      expect(movieResult).toHaveProperty('genreIds', [1, 2]);
      expect(movieResult).toHaveProperty('mediaType', 'movie');
      
      // Keep original snake_case for backward compatibility
      expect(movieResult).toHaveProperty('poster_path', '/test.jpg');
      expect(movieResult).toHaveProperty('backdrop_path', '/backdrop.jpg');
      expect(movieResult).toHaveProperty('release_date', '2023-01-01');
      expect(movieResult).toHaveProperty('vote_average', 8.5);
      expect(movieResult).toHaveProperty('genre_ids', [1, 2]);
      expect(movieResult).toHaveProperty('media_type', 'movie');
    });
  });

  describe('GET /media/:tmdbId', () => {
    const mockMediaDetails = {
      id: 123,
      title: 'Test Movie',
      overview: 'A test movie',
      poster_path: '/test.jpg',
      backdrop_path: '/backdrop.jpg',
      release_date: '2023-01-01',
      vote_average: 8.5,
      genre_ids: [1, 2],
      media_type: 'movie',
      genres: [{ id: 1, name: 'Action' }],
    };

    it('should return media details successfully', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.getMediaDetails.mockResolvedValue(mockMediaDetails);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/media/123').query({ type: 'movie' });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(123);
      expect(response.body.title).toBe('Test Movie');
      expect(mockTmdbService.getMediaDetails).toHaveBeenCalledWith(123, 'movie');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached media details when available', async () => {
      const cachedDetails = { ...mockMediaDetails, cached: true };
      mockCacheService.get.mockReturnValue(cachedDetails);

      const response = await request(app).get('/media/123').query({ type: 'movie' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedDetails);
      expect(mockTmdbService.getMediaDetails).not.toHaveBeenCalled();
    });

    it('should enrich media details with database provider data', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.getMediaDetails.mockResolvedValue(mockMediaDetails);

      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue({
        id: 'media-123',
        tmdbId: 123,
        streamingProviders: [
          {
            provider: 'netflix',
            regions: ['US', 'GB'],
          },
        ],
      });

      const response = await request(app).get('/media/123').query({ type: 'movie' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('inDatabase', true);
      expect(response.body).toHaveProperty('cached');
    });

    it('should handle TV show details', async () => {
      const tvDetails = { ...mockMediaDetails, media_type: 'tv' };
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.getMediaDetails.mockResolvedValue(tvDetails);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/media/123').query({ type: 'tv' });

      expect(response.status).toBe(200);
      expect(mockTmdbService.getMediaDetails).toHaveBeenCalledWith(123, 'tv');
    });

    it('should validate tmdbId parameter', async () => {
      const response = await request(app).get('/media/invalid').query({ type: 'movie' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid parameters');
    });

    it('should validate type parameter', async () => {
      const response = await request(app).get('/media/123').query({ type: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid parameters');
    });

    it('should handle TMDB API errors for media details', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.getMediaDetails.mockRejectedValue(new Error('TMDB API Error'));

      const response = await request(app).get('/media/123').query({ type: 'movie' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch media details');
    });

    it('should return stale cache for media details when TMDB is down', async () => {
      mockCacheService.get.mockReturnValueOnce(undefined).mockReturnValueOnce(mockMediaDetails);

      mockTmdbService.getMediaDetails.mockRejectedValue(new Error('TMDB API Error'));

      const response = await request(app).get('/media/123').query({ type: 'movie' });

      expect(response.status).toBe(200);
      expect(response.body.stale).toBe(true);
      expect(response.body.warning).toContain('Using cached data');
    });
  });

  describe('GET /genres/:type', () => {
    const mockGenres = {
      genres: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Drama' },
        { id: 3, name: 'Comedy' },
      ],
    };

    it('should return movie genres successfully', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.getGenres.mockResolvedValue(mockGenres.genres);

      const response = await request(app).get('/genres/movie');

      expect(response.status).toBe(200);
      expect(response.body.genres).toEqual(mockGenres.genres);
      expect(mockTmdbService.getGenres).toHaveBeenCalledWith('movie');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return TV genres successfully', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.getGenres.mockResolvedValue(mockGenres.genres);

      const response = await request(app).get('/genres/tv');

      expect(response.status).toBe(200);
      expect(response.body.genres).toEqual(mockGenres.genres);
      expect(mockTmdbService.getGenres).toHaveBeenCalledWith('tv');
    });

    it('should return cached genres when available', async () => {
      const cachedGenres = { genres: mockGenres.genres, cached: true };
      mockCacheService.get.mockReturnValue(cachedGenres);

      const response = await request(app).get('/genres/movie');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedGenres);
      expect(mockTmdbService.getGenres).not.toHaveBeenCalled();
    });

    it('should validate genre type', async () => {
      const response = await request(app).get('/genres/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid type');
    });

    it('should handle TMDB API errors for genres', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.getGenres.mockRejectedValue(new Error('TMDB API Error'));

      const response = await request(app).get('/genres/movie');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch genres');
    });
  });

  describe('POST /cache/clear', () => {
    it('should clear cache successfully', async () => {
      mockCacheService.clear.mockImplementation(() => {});

      const response = await request(app).post('/cache/clear');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cache cleared successfully');
      expect(mockCacheService.clear).toHaveBeenCalled();
    });

    it('should handle cache clear errors', async () => {
      mockCacheService.clear.mockImplementation(() => {
        throw new Error('Cache clear error');
      });

      const response = await request(app).post('/cache/clear');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to clear cache');
    });
  });

  describe('GET /cache/stats', () => {
    it('should return cache statistics', async () => {
      const mockStats = {
        keys: 10,
        hits: 100,
        misses: 20,
        ksize: 1024,
        vsize: 2048,
      };
      mockCacheService.getStats.mockReturnValue(mockStats);

      const response = await request(app).get('/cache/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(mockCacheService.getStats).toHaveBeenCalled();
    });

    it('should handle cache stats errors', async () => {
      mockCacheService.getStats.mockImplementation(() => {
        throw new Error('Stats error');
      });

      const response = await request(app).get('/cache/stats');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get cache statistics');
    });
  });
});
