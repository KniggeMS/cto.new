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

describe('Search and Watchlist Integration', () => {
  let mockPrismaInstance: any;
  let authToken: string;

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
      user: {
        findUnique: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockPrisma.mockImplementation(() => mockPrismaInstance);

    // Mock authentication
    authToken = 'Bearer mock-token';
  });

  describe('Search to Watchlist Flow', () => {
    const mockSearchResponse = {
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
        },
      ],
      total_results: 1,
      total_pages: 1,
    };

    it('should search and add new media item to watchlist with metadata', async () => {
      // Setup mocks
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null); // Media doesn't exist
      mockPrismaInstance.watchlistEntry.findUnique.mockResolvedValue(null); // Not in watchlist
      mockPrismaInstance.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaInstance.session.findUnique.mockResolvedValue({ userId: 'user-123' });

      const createdMediaItem = {
        id: 'media-123',
        tmdbId: 123,
        tmdbType: 'movie',
        title: 'Test Movie',
        description: 'A test movie overview',
        posterPath: '/test-poster.jpg',
        backdropPath: '/test-backdrop.jpg',
        releaseDate: new Date('2023-01-01'),
        rating: 8.5,
        genres: [],
        creators: [],
      };

      const createdWatchlistEntry = {
        id: 'entry-123',
        userId: 'user-123',
        mediaItemId: 'media-123',
        status: 'not_watched',
        rating: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        dateAdded: new Date(),
        dateUpdated: new Date(),
        mediaItem: createdMediaItem,
      };

      mockPrismaInstance.mediaItem.create.mockResolvedValue(createdMediaItem);
      mockPrismaInstance.watchlistEntry.create.mockResolvedValue(createdWatchlistEntry);

      // Step 1: Search for media
      const searchResponse = await request(app)
        .get('/search')
        .query({ query: 'test movie' })
        .set('Authorization', authToken);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data).toHaveLength(1);
      expect(searchResponse.body.data[0]).toHaveProperty('posterPath', '/test-poster.jpg');
      expect(searchResponse.body.data[0]).toHaveProperty('mediaType', 'movie');
      expect(searchResponse.body.data[0]).toHaveProperty('releaseDate', '2023-01-01');
      expect(searchResponse.body.data[0]).toHaveProperty('voteAverage', 8.5);

      // Step 2: Add to watchlist with metadata
      const watchlistResponse = await request(app)
        .post('/watchlist')
        .set('Authorization', authToken)
        .send({
          tmdbId: 123,
          tmdbType: 'movie',
          status: 'not_watched',
          metadata: {
            title: 'Test Movie',
            description: 'A test movie overview',
            posterPath: '/test-poster.jpg',
            backdropPath: '/test-backdrop.jpg',
            releaseDate: '2023-01-01',
            rating: 8.5,
            genres: [],
            creators: [],
            streamingProviders: [],
          },
        });

      expect(watchlistResponse.status).toBe(201);
      expect(watchlistResponse.body.data.mediaItem.title).toBe('Test Movie');
      expect(watchlistResponse.body.data.mediaItem.posterPath).toBe('/test-poster.jpg');
      expect(watchlistResponse.body.data.mediaItem.tmdbType).toBe('movie');

      // Verify media item was created with correct metadata
      expect(mockPrismaInstance.mediaItem.create).toHaveBeenCalledWith({
        data: {
          tmdbId: 123,
          tmdbType: 'movie',
          title: 'Test Movie',
          description: 'A test movie overview',
          posterPath: '/test-poster.jpg',
          backdropPath: '/test-backdrop.jpg',
          releaseDate: new Date('2023-01-01'),
          rating: 8.5,
          genres: [],
          creators: [],
        },
      });
    });

    it('should add existing media item to watchlist without metadata', async () => {
      // Setup mocks
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      
      // Media already exists
      const existingMediaItem = {
        id: 'media-existing',
        tmdbId: 123,
        tmdbType: 'movie',
        title: 'Existing Movie',
        posterPath: '/existing-poster.jpg',
      };
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(existingMediaItem);
      mockPrismaInstance.watchlistEntry.findUnique.mockResolvedValue(null); // Not in watchlist
      mockPrismaInstance.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaInstance.session.findUnique.mockResolvedValue({ userId: 'user-123' });

      const createdWatchlistEntry = {
        id: 'entry-123',
        userId: 'user-123',
        mediaItemId: 'media-existing',
        status: 'not_watched',
        rating: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        dateAdded: new Date(),
        dateUpdated: new Date(),
        mediaItem: existingMediaItem,
      };

      mockPrismaInstance.watchlistEntry.create.mockResolvedValue(createdWatchlistEntry);

      // Step 1: Search for media
      const searchResponse = await request(app)
        .get('/search')
        .query({ query: 'existing movie' })
        .set('Authorization', authToken);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data[0]).toHaveProperty('inDatabase', true);

      // Step 2: Add to watchlist without metadata (media already exists)
      const watchlistResponse = await request(app)
        .post('/watchlist')
        .set('Authorization', authToken)
        .send({
          tmdbId: 123,
          tmdbType: 'movie',
          status: 'not_watched',
        });

      expect(watchlistResponse.status).toBe(201);
      expect(watchlistResponse.body.data.mediaItem.title).toBe('Existing Movie');
      
      // Verify media item was not created (already exists)
      expect(mockPrismaInstance.mediaItem.create).not.toHaveBeenCalled();
      expect(mockPrismaInstance.watchlistEntry.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          mediaItemId: 'media-existing',
          status: 'not_watched',
          rating: null,
          notes: null,
        },
        include: {
          mediaItem: {
            include: {
              streamingProviders: true,
            },
          },
        },
      });
    });

    it('should handle duplicate watchlist entries', async () => {
      // Setup mocks
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue({
        id: 'media-existing',
        tmdbId: 123,
        tmdbType: 'movie',
      });
      
      // Already in watchlist
      mockPrismaInstance.watchlistEntry.findUnique.mockResolvedValue({
        id: 'existing-entry',
        userId: 'user-123',
        mediaItemId: 'media-existing',
      });
      mockPrismaInstance.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaInstance.session.findUnique.mockResolvedValue({ userId: 'user-123' });

      // Step 1: Search for media
      const searchResponse = await request(app)
        .get('/search')
        .query({ query: 'duplicate movie' })
        .set('Authorization', authToken);

      expect(searchResponse.status).toBe(200);

      // Step 2: Try to add to watchlist again
      const watchlistResponse = await request(app)
        .post('/watchlist')
        .set('Authorization', authToken)
        .send({
          tmdbId: 123,
          tmdbType: 'movie',
          status: 'not_watched',
        });

      expect(watchlistResponse.status).toBe(409);
      expect(watchlistResponse.body.error).toBe('This media item is already in your watchlist');
      expect(watchlistResponse.body.entryId).toBe('existing-entry');
    });

    it('should require metadata for new media items', async () => {
      // Setup mocks
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockSearchResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null); // Media doesn't exist
      mockPrismaInstance.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaInstance.session.findUnique.mockResolvedValue({ userId: 'user-123' });

      // Step 1: Search for media
      const searchResponse = await request(app)
        .get('/search')
        .query({ query: 'new movie' })
        .set('Authorization', authToken);

      expect(searchResponse.status).toBe(200);

      // Step 2: Try to add to watchlist without metadata
      const watchlistResponse = await request(app)
        .post('/watchlist')
        .set('Authorization', authToken)
        .send({
          tmdbId: 123,
          tmdbType: 'movie',
          status: 'not_watched',
          // No metadata provided
        });

      expect(watchlistResponse.status).toBe(400);
      expect(watchlistResponse.body.error).toBe('Media item not found. Please provide metadata to create it.');
    });
  });

  describe('Search Response Normalization', () => {
    const mockMixedResponse = {
      page: 1,
      results: [
        {
          id: 123,
          title: 'Test Movie',
          overview: 'A test movie',
          poster_path: '/movie-poster.jpg',
          backdrop_path: '/movie-backdrop.jpg',
          release_date: '2023-01-01',
          vote_average: 8.5,
          genre_ids: [1, 2],
          media_type: 'movie',
        },
        {
          id: 456,
          name: 'Test TV Show',
          overview: 'A test TV show',
          poster_path: '/tv-poster.jpg',
          backdrop_path: '/tv-backdrop.jpg',
          first_air_date: '2023-02-01',
          vote_average: 9.0,
          genre_ids: [3, 4],
          media_type: 'tv',
        },
      ],
      total_results: 2,
      total_pages: 1,
    };

    it('should normalize both movie and TV show responses', async () => {
      mockCacheService.get.mockReturnValue(undefined);
      mockTmdbService.searchMulti.mockResolvedValue(mockMixedResponse);
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/search')
        .query({ query: 'test query' })
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);

      const movieResult = response.body.data.find((r: any) => r.media_type === 'movie');
      const tvResult = response.body.data.find((r: any) => r.media_type === 'tv');

      // Check movie normalization
      expect(movieResult).toHaveProperty('posterPath', '/movie-poster.jpg');
      expect(movieResult).toHaveProperty('backdropPath', '/movie-backdrop.jpg');
      expect(movieResult).toHaveProperty('releaseDate', '2023-01-01');
      expect(movieResult).toHaveProperty('voteAverage', 8.5);
      expect(movieResult).toHaveProperty('genreIds', [1, 2]);
      expect(movieResult).toHaveProperty('mediaType', 'movie');

      // Check TV show normalization
      expect(tvResult).toHaveProperty('posterPath', '/tv-poster.jpg');
      expect(tvResult).toHaveProperty('backdropPath', '/tv-backdrop.jpg');
      expect(tvResult).toHaveProperty('releaseDate', '2023-02-01'); // first_air_date -> releaseDate
      expect(tvResult).toHaveProperty('voteAverage', 9.0);
      expect(tvResult).toHaveProperty('genreIds', [3, 4]);
      expect(tvResult).toHaveProperty('mediaType', 'tv');

      // Check response structure
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('totalPages', 1);
      expect(response.body).toHaveProperty('totalResults', 2);
      expect(response.body).toHaveProperty('cached', false);
    });
  });
});