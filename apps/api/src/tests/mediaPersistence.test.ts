import { PrismaClient } from '@prisma/client';
import { MediaPersistenceService, mediaPersistenceService } from '../services/mediaPersistenceService';
import { tmdbService } from '../services/tmdbService';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../services/tmdbService');

const MockPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;
const mockTmdbService = tmdbService as jest.Mocked<typeof tmdbService>;

describe('MediaPersistenceService', () => {
  let mediaService: MediaPersistenceService;
  let mockPrismaInstance: any;
  let mockMediaDetails: any;
  let mockWatchProviders: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Prisma instance
    mockPrismaInstance = {
      mediaItem: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      streamingProvider: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    MockPrismaClient.mockImplementation(() => mockPrismaInstance);
    mediaService = new MediaPersistenceService(new PrismaClient());
  });

  describe('persistMediaItem', () => {
    beforeEach(() => {
      // Set up mock data for these tests
      mockMediaDetails = {
        id: 123,
        title: 'Test Movie',
        overview: 'A test movie',
        poster_path: '/test.jpg',
        backdrop_path: '/backdrop.jpg',
        release_date: '2023-01-01',
        vote_average: 8.5,
        genre_ids: [1, 2],
        media_type: 'movie' as const,
        genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Drama' }],
        watch_providers: {
          results: {
            US: {
              flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }],
              buy: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/apple.jpg' }],
            },
            GB: {
              flatrate: [{ provider_id: 9, provider_name: 'Disney+', logo_path: '/disney.jpg' }],
            },
          },
        },
      };

      mockWatchProviders = {
        results: {
          US: {
            flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }],
            buy: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/apple.jpg' }],
          },
          GB: {
            flatrate: [{ provider_id: 9, provider_name: 'Disney+', logo_path: '/disney.jpg' }],
          },
        },
      };
    });

    it('should return existing media item if found', async () => {
      const existingMedia = {
        id: 'media-123',
        tmdbId: 123,
        tmdbType: 'movie',
        title: 'Test Movie',
        streamingProviders: [],
      };

      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(existingMedia);

      const result = await mediaService.persistMediaItem(123, 'movie');

      expect(result.mediaItem).toEqual(existingMedia);
      expect(result.isNew).toBe(false);
      expect(mockTmdbService.getMediaDetails).not.toHaveBeenCalled();
    });

    it('should create new media item from TMDB data', async () => {
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);
      mockTmdbService.getMediaDetails.mockResolvedValue(mockMediaDetails);
      
      const createdMedia = {
        id: 'new-media-123',
        tmdbId: 123,
        tmdbType: 'movie',
        title: 'Test Movie',
      };
      mockPrismaInstance.mediaItem.create.mockResolvedValue(createdMedia);
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      const result = await mediaService.persistMediaItem(123, 'movie');

      expect(mockTmdbService.getMediaDetails).toHaveBeenCalledWith(123, 'movie');
      expect(mockPrismaInstance.mediaItem.create).toHaveBeenCalledWith({
        data: {
          tmdbId: 123,
          tmdbType: 'movie',
          title: 'Test Movie',
          description: 'A test movie',
          posterPath: '/test.jpg',
          backdropPath: '/backdrop.jpg',
          releaseDate: new Date('2023-01-01'),
          rating: 8.5,
          genres: ['Action', 'Drama'],
          creators: [],
        }
      });
      expect(result.isNew).toBe(true);
    });

    it('should handle TV show data correctly', async () => {
      const tvDetails = {
        ...mockMediaDetails,
        media_type: 'tv' as const,
        name: 'Test TV Show',
        first_air_date: '2023-01-01',
      };

      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);
      mockTmdbService.getMediaDetails.mockResolvedValue(tvDetails);
      mockPrismaInstance.mediaItem.create.mockResolvedValue({ id: 'new-tv-123' });
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      await mediaService.persistMediaItem(456, 'tv');

      expect(mockTmdbService.getMediaDetails).toHaveBeenCalledWith(456, 'tv');
      expect(mockPrismaInstance.mediaItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tmdbId: 456,
          tmdbType: 'tv',
          title: 'Test TV Show',
        })
      });
    });

    it('should persist streaming providers correctly', async () => {
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);
      mockTmdbService.getMediaDetails.mockResolvedValue(mockMediaDetails);
      mockPrismaInstance.mediaItem.create.mockResolvedValue({ id: 'new-media-123' });
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      await mediaService.persistMediaItem(123, 'movie');

      // Check that streaming providers are created
      expect(mockPrismaInstance.streamingProvider.create).toHaveBeenCalledTimes(3);
      
      // Netflix (US)
      expect(mockPrismaInstance.streamingProvider.create).toHaveBeenCalledWith({
        data: {
          mediaItemId: 'new-media-123',
          provider: 'netflix',
          regions: ['US'],
        }
      });

      // Apple TV (US) - buy
      expect(mockPrismaInstance.streamingProvider.create).toHaveBeenCalledWith({
        data: {
          mediaItemId: 'new-media-123',
          provider: 'apple tv_buy',
          regions: ['US'],
        }
      });

      // Disney+ (GB)
      expect(mockPrismaInstance.streamingProvider.create).toHaveBeenCalledWith({
        data: {
          mediaItemId: 'new-media-123',
          provider: 'disney+',
          regions: ['GB'],
        }
      });
    });

    it('should handle missing optional fields', async () => {
      const minimalMediaDetails = {
        id: 123,
        title: 'Minimal Movie',
        overview: null,
        poster_path: null,
        backdrop_path: null,
        release_date: null,
        vote_average: null,
        genre_ids: [],
        media_type: 'movie' as const,
        genres: [],
        watch_providers: { results: {} },
      };

      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);
      mockTmdbService.getMediaDetails.mockResolvedValue(minimalMediaDetails);
      mockPrismaInstance.mediaItem.create.mockResolvedValue({ id: 'minimal-media' });

      await mediaService.persistMediaItem(123, 'movie');

      expect(mockPrismaInstance.mediaItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tmdbId: 123,
          tmdbType: 'movie',
          title: 'Minimal Movie',
          description: undefined,
          posterPath: undefined,
          backdropPath: undefined,
          releaseDate: undefined,
          rating: undefined,
          genres: [],
          creators: [],
        })
      });
    });

    it('should fetch complete media item after creation', async () => {
      mockPrismaInstance.mediaItem.findUnique
        .mockResolvedValueOnce(null) // Initial check
        .mockResolvedValueOnce({ // Final fetch with providers
          id: 'new-media-123',
          tmdbId: 123,
          streamingProviders: [
            { provider: 'netflix', regions: ['US'] },
          ],
        });
      
      mockTmdbService.getMediaDetails.mockResolvedValue(mockMediaDetails);
      mockPrismaInstance.mediaItem.create.mockResolvedValue({ id: 'new-media-123' });
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      const result = await mediaService.persistMediaItem(123, 'movie');

      expect(mockPrismaInstance.mediaItem.findUnique).toHaveBeenCalledTimes(2);
      expect(result.mediaItem).toHaveProperty('streamingProviders');
    });
  });

  describe('updateStreamingProviders', () => {
    let mockMediaItem: any;

    beforeEach(() => {
      // Set up mock data for these tests
      mockMediaItem = {
        id: 'media-123',
        tmdbId: 123,
        tmdbType: 'movie',
      };
      
      mockMediaDetails = {
        id: 123,
        title: 'Test Movie',
        watch_providers: mockWatchProviders,
      };
    });

    it('should update streaming providers for existing media item', async () => {
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(mockMediaItem);
      mockTmdbService.getMediaDetails.mockResolvedValue({
        ...mockMediaDetails,
        watch_providers: mockWatchProviders,
      });
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      await mediaService.updateStreamingProviders('media-123');

      expect(mockPrismaInstance.streamingProvider.deleteMany).toHaveBeenCalledWith({
        where: { mediaItemId: 'media-123' },
      });
      expect(mockPrismaInstance.streamingProvider.create).toHaveBeenCalled();
    });

    it('should throw error if media item not found', async () => {
      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);

      await expect(mediaService.updateStreamingProviders('non-existent'))
        .rejects.toThrow('Media item not found');
    });
  });

  describe('batchPersistMediaItems', () => {
    const mockMediaDetails = {
      id: 123,
      title: 'Test Movie',
      overview: 'A test movie',
      poster_path: '/test.jpg',
      backdrop_path: '/backdrop.jpg',
      release_date: '2023-01-01',
      vote_average: 8.5,
      genre_ids: [1, 2],
      media_type: 'movie' as const,
      genres: [{ id: 1, name: 'Action' }],
      watch_providers: { results: {} },
    };

    it('should process multiple media items successfully', async () => {
      const items = [
        { tmdbId: 123, mediaType: 'movie' as const },
        { tmdbId: 456, mediaType: 'tv' as const },
      ];

      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);
      mockTmdbService.getMediaDetails.mockResolvedValue(mockMediaDetails);
      mockPrismaInstance.mediaItem.create.mockResolvedValue({ id: 'new-media' });
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      const result = await mediaService.batchPersistMediaItems(items);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(mockTmdbService.getMediaDetails).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure', async () => {
      const items = [
        { tmdbId: 123, mediaType: 'movie' as const },
        { tmdbId: 456, mediaType: 'tv' as const },
      ];

      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);
      mockTmdbService.getMediaDetails
        .mockResolvedValueOnce(mockMediaDetails)
        .mockRejectedValueOnce(new Error('TMDB Error'));
      mockPrismaInstance.mediaItem.create.mockResolvedValue({ id: 'new-media' });

      const result = await mediaService.batchPersistMediaItems(items);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].tmdbId).toBe(456);
    });

    it('should process items in batches to respect rate limits', async () => {
      // Create 12 items (3 batches of 5, 5, 2)
      const items = Array.from({ length: 12 }, (_, i) => ({
        tmdbId: i + 1,
        mediaType: 'movie' as const,
      }));

      mockPrismaInstance.mediaItem.findUnique.mockResolvedValue(null);
      mockTmdbService.getMediaDetails.mockResolvedValue(mockMediaDetails);
      mockPrismaInstance.mediaItem.create.mockResolvedValue({ id: 'new-media' });
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      const startTime = Date.now();
      await mediaService.batchPersistMediaItems(items);
      const endTime = Date.now();

      // Should take at least 2 seconds due to delays between batches
      expect(endTime - startTime).toBeGreaterThan(2000);
      expect(mockTmdbService.getMediaDetails).toHaveBeenCalledTimes(12);
    });
  });

  describe('getStaleMediaItems', () => {
    it('should return media items older than specified days', async () => {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 10);

      const staleItems = [
        {
          id: 'media-1',
          tmdbId: 123,
          updatedAt: staleDate,
          streamingProviders: [],
        },
        {
          id: 'media-2',
          tmdbId: 456,
          updatedAt: staleDate,
          streamingProviders: [],
        },
      ];

      mockPrismaInstance.mediaItem.findMany.mockResolvedValue(staleItems);

      const result = await mediaService.getStaleMediaItems(7);

      expect(mockPrismaInstance.mediaItem.findMany).toHaveBeenCalledWith({
        where: {
          updatedAt: {
            lt: expect.any(Date),
          },
        },
        include: {
          streamingProviders: true,
        },
        orderBy: {
          updatedAt: 'asc',
        },
        take: 50,
      });
      expect(result).toEqual(staleItems);
    });

    it('should use default 7 days if not specified', async () => {
      mockPrismaInstance.mediaItem.findMany.mockResolvedValue([]);

      await mediaService.getStaleMediaItems();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      expect(mockPrismaInstance.mediaItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            updatedAt: {
              lt: expect.any(Date),
            },
          },
        })
      );
    });
  });

  describe('updateStaleMediaItems', () => {
    beforeEach(() => {
      // Set up mock data for these tests
      mockTmdbService.getMediaDetails.mockResolvedValue({
        watch_providers: { results: {} },
      } as any);
      
      // Mock updateStreamingProviders to avoid calling getMediaDetails
      jest.spyOn(mediaService, 'updateStreamingProviders').mockResolvedValue();
    });

    it('should update stale media items successfully', async () => {
      const staleItems = [
        {
          id: 'media-1',
          tmdbId: 123,
          tmdbType: 'movie',
          streamingProviders: [],
        },
        {
          id: 'media-2',
          tmdbId: 456,
          tmdbType: 'tv',
          streamingProviders: [],
        },
      ];

      mockPrismaInstance.mediaItem.findMany.mockResolvedValue(staleItems);
      mockPrismaInstance.streamingProvider.deleteMany.mockResolvedValue({});
      mockPrismaInstance.streamingProvider.create.mockResolvedValue({});

      const result = await mediaService.updateStaleMediaItems();

      expect(result.updated).toBe(2);
      expect(result.failed).toBe(0);
      expect(mediaService.updateStreamingProviders).toHaveBeenCalledTimes(2);
      expect(mediaService.updateStreamingProviders).toHaveBeenCalledWith('media-1');
      expect(mediaService.updateStreamingProviders).toHaveBeenCalledWith('media-2');
    });

    it('should handle failures during update', async () => {
      const staleItems = [
        {
          id: 'media-1',
          tmdbId: 123,
          tmdbType: 'movie',
          streamingProviders: [],
        },
        {
          id: 'media-2',
          tmdbId: 456,
          tmdbType: 'tv',
          streamingProviders: [],
        },
      ];

      mockPrismaInstance.mediaItem.findMany.mockResolvedValue(staleItems);
      
      // Mock updateStreamingProviders to resolve once, reject once
      jest.spyOn(mediaService, 'updateStreamingProviders')
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('Update failed'));

      const result = await mediaService.updateStaleMediaItems();

      expect(result.updated).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});

describe('mediaPersistenceService singleton', () => {
  it('should export a singleton instance', () => {
    expect(mediaPersistenceService).toBeInstanceOf(MediaPersistenceService);
  });
});