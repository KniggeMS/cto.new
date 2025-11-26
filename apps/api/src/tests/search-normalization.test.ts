import request from 'supertest';
import { app } from '../server';
import { tmdbService } from '../services/tmdbService';
import { cacheService } from '../services/cacheService';

// Mock dependencies
jest.mock('../services/tmdbService');
jest.mock('../services/cacheService');

const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('Search Response Normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CamelCase Conversion', () => {
    const mockTMDBResponse = {
      page: 1,
      results: [
        {
          id: 123,
          title: 'Test Movie',
          overview: 'A test movie overview',
          poster_path: '/test-poster.jpg',
          backdrop_path: '/test-backdrop.jpg',
          release_date: '2023-01-01',
          vote_average: 8.5,
          genre_ids: [1, 2, 3],
          media_type: 'movie',
          adult: false,
          original_language: 'en',
          popularity: 100.5,
          vote_count: 1000,
        },
        {
          id: 456,
          name: 'Test TV Show',
          overview: 'A test TV show overview',
          poster_path: '/test-tv-poster.jpg',
          backdrop_path: '/test-tv-backdrop.jpg',
          first_air_date: '2023-02-01',
          vote_average: 9.0,
          genre_ids: [4, 5, 6],
          media_type: 'tv',
          adult: false,
          original_language: 'en',
          popularity: 200.5,
          vote_count: 2000,
          origin_country: ['US'],
        },
      ],
      total_results: 2,
      total_pages: 1,
    };

    it('should convert TMDB snake_case to camelCase for movies', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockTMDBResponse);

      const response = await request(app).get('/search').query({ query: 'test' });

      expect(response.status).toBe(200);
      
      const movieResult = response.body.data.find((r: any) => r.id === 123);
      
      // Check camelCase fields
      expect(movieResult.posterPath).toBe('/test-poster.jpg');
      expect(movieResult.backdropPath).toBe('/test-backdrop.jpg');
      expect(movieResult.releaseDate).toBe('2023-01-01');
      expect(movieResult.voteAverage).toBe(8.5);
      expect(movieResult.genreIds).toEqual([1, 2, 3]);
      expect(movieResult.mediaType).toBe('movie');
      
      // Check original snake_case fields are preserved
      expect(movieResult.poster_path).toBe('/test-poster.jpg');
      expect(movieResult.backdrop_path).toBe('/test-backdrop.jpg');
      expect(movieResult.release_date).toBe('2023-01-01');
      expect(movieResult.vote_average).toBe(8.5);
      expect(movieResult.genre_ids).toEqual([1, 2, 3]);
      expect(movieResult.media_type).toBe('movie');
    });

    it('should convert TMDB snake_case to camelCase for TV shows', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockTMDBResponse);

      const response = await request(app).get('/search').query({ query: 'test' });

      expect(response.status).toBe(200);
      
      const tvResult = response.body.data.find((r: any) => r.id === 456);
      
      // Check camelCase fields
      expect(tvResult.posterPath).toBe('/test-tv-poster.jpg');
      expect(tvResult.backdropPath).toBe('/test-tv-backdrop.jpg');
      expect(tvResult.releaseDate).toBe('2023-02-01'); // first_air_date -> releaseDate
      expect(tvResult.voteAverage).toBe(9.0);
      expect(tvResult.genreIds).toEqual([4, 5, 6]);
      expect(tvResult.mediaType).toBe('tv');
      
      // Check original snake_case fields are preserved
      expect(tvResult.poster_path).toBe('/test-tv-poster.jpg');
      expect(tvResult.backdrop_path).toBe('/test-tv-backdrop.jpg');
      expect(tvResult.release_date).toBe('2023-02-01');
      expect(tvResult.vote_average).toBe(9.0);
      expect(tvResult.genre_ids).toEqual([4, 5, 6]);
      expect(tvResult.media_type).toBe('tv');
    });

    it('should maintain response structure with data wrapper', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockTMDBResponse);

      const response = await request(app).get('/search').query({ query: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('totalPages', 1);
      expect(response.body).toHaveProperty('totalResults', 2);
      expect(response.body).toHaveProperty('cached', false);
      
      expect(response.body.data).toHaveLength(2);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle caching with normalized format', async () => {
      const cachedResponse = {
        data: [
          {
            id: 123,
            title: 'Cached Movie',
            posterPath: '/cached-poster.jpg',
            mediaType: 'movie',
          },
        ],
        page: 1,
        totalPages: 1,
        totalResults: 1,
        cached: true,
      };
      
      mockCacheService.get.mockReturnValue(cachedResponse);

      const response = await request(app).get('/search').query({ query: 'cached' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedResponse);
      expect(mockTmdbService.searchMulti).not.toHaveBeenCalled();
    });

    it('should convert old cache format to new format for stale cache', async () => {
      const oldCacheFormat = {
        page: 1,
        results: [
          {
            id: 123,
            title: 'Old Cache Movie',
            poster_path: '/old-poster.jpg',
            media_type: 'movie',
          },
        ],
        total_results: 1,
        total_pages: 1,
      };
      
      mockCacheService.get
        .mockReturnValueOnce(undefined) // Fresh cache miss
        .mockReturnValueOnce(oldCacheFormat) // Stale cache hit
        .mockReturnValueOnce(undefined); // Second fresh cache miss

      mockTmdbService.searchMulti.mockRejectedValue(new Error('TMDB API Error'));

      const response = await request(app).get('/search').query({ query: 'old cache' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data'); // Converted from results
      expect(response.body).toHaveProperty('stale', true);
      expect(response.body).toHaveProperty('warning');
      expect(response.body.data[0]).toHaveProperty('posterPath'); // Normalized
    });
  });

  describe('Field Validation', () => {
    it('should handle missing optional fields gracefully', async () => {
      const responseWithMissingFields = {
        page: 1,
        results: [
          {
            id: 123,
            title: 'Minimal Movie',
            overview: null,
            poster_path: null,
            backdrop_path: null,
            release_date: null,
            vote_average: null,
            genre_ids: [],
            media_type: 'movie',
          },
        ],
        total_results: 1,
        total_pages: 1,
      };

      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(responseWithMissingFields);

      const response = await request(app).get('/search').query({ query: 'minimal' });

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('posterPath', null);
      expect(response.body.data[0]).toHaveProperty('backdropPath', null);
      expect(response.body.data[0]).toHaveProperty('releaseDate', null);
      expect(response.body.data[0]).toHaveProperty('voteAverage', null);
      expect(response.body.data[0]).toHaveProperty('genreIds', []);
    });

    it('should preserve all TMDB fields', async () => {
      const fullTMDBResponse = {
        page: 1,
        results: [
          {
            id: 123,
            title: 'Full Movie',
            overview: 'Complete overview',
            poster_path: '/poster.jpg',
            backdrop_path: '/backdrop.jpg',
            release_date: '2023-01-01',
            vote_average: 8.5,
            genre_ids: [1, 2],
            media_type: 'movie',
            adult: false,
            original_language: 'en',
            popularity: 100.5,
            video: false,
            vote_count: 1000,
          },
        ],
        total_results: 1,
        total_pages: 1,
      };

      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(fullTMDBResponse);

      const response = await request(app).get('/search').query({ query: 'full' });

      expect(response.status).toBe(200);
      const result = response.body.data[0];
      
      // Check all original fields are preserved
      expect(result.adult).toBe(false);
      expect(result.original_language).toBe('en');
      expect(result.popularity).toBe(100.5);
      expect(result.video).toBe(false);
      expect(result.vote_count).toBe(1000);
      
      // Check camelCase versions are added
      expect(result.posterPath).toBe('/poster.jpg');
      expect(result.backdropPath).toBe('/backdrop.jpg');
      expect(result.releaseDate).toBe('2023-01-01');
      expect(result.voteAverage).toBe(8.5);
      expect(result.genreIds).toEqual([1, 2]);
      expect(result.mediaType).toBe('movie');
    });
  });
});