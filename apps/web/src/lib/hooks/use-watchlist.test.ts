import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '@/lib/api/watchlist';
import type { CreateWatchlistEntryData, UpdateWatchlistEntryData, WatchlistEntry } from '@/lib/api/watchlist';

// Mock the API
jest.mock('@/lib/api/watchlist', () => ({
  watchlistApi: {
    getWatchlist: jest.fn(),
    addToWatchlist: jest.fn(),
    updateWatchlistEntry: jest.fn(),
    removeFromWatchlist: jest.fn(),
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockWatchlistApi = watchlistApi as jest.Mocked<typeof watchlistApi>;

describe('useWatchlist hooks', () => {
  let queryClient: any;
  let mockQueryClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh query client for each test
    queryClient = {
      cancelQueries: jest.fn(),
      getQueryData: jest.fn(),
      setQueryData: jest.fn(),
      invalidateQueries: jest.fn(),
    };

    mockQueryClient = queryClient;
    
    // Mock useQueryClient to return our mock
    jest.doMock('@tanstack/react-query', () => ({
      useQuery: jest.requireActual('@tanstack/react-query').useQuery,
      useMutation: jest.requireActual('@tanstack/react-query').useMutation,
      useQueryClient: () => mockQueryClient,
    }));
  });

  describe('useAddToWatchlist optimistic updates', () => {
    it('should optimistically update when adding to watchlist', async () => {
      const mockNewEntry: CreateWatchlistEntryData = {
        tmdbId: 123,
        mediaType: 'movie',
        status: 'plan_to_watch',
        rating: 8,
        notes: 'Great movie!',
      };

      const mockResponse: WatchlistEntry = {
        id: '1',
        mediaItemId: 'media-1',
        ...mockNewEntry,
        mediaItem: {
          id: 'media-1',
          tmdbId: 123,
          title: 'Test Movie',
          mediaType: 'movie',
          posterPath: '/test.jpg',
          releaseDate: '2024-01-01',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        dateAdded: '2024-01-01T00:00:00Z',
        dateUpdated: '2024-01-01T00:00:00Z',
      };

      mockWatchlistApi.addToWatchlist.mockResolvedValue(mockResponse);
      mockQueryClient.getQueryData.mockReturnValue([]);

      const { useAddToWatchlist } = require('@/lib/hooks/use-watchlist');
      const { mutateAsync } = useAddToWatchlist();

      // Call the mutation
      await mutateAsync(mockNewEntry);

      // Verify optimistic update was called
      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({ queryKey: ['watchlist'] });
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ['watchlist'],
        expect.any(Function)
      );

      // Verify the optimistic entry was added
      const updateFunction = mockQueryClient.setQueryData.mock.calls[0][1];
      const optimisticResult = updateFunction([]);
      expect(optimisticResult).toHaveLength(1);
      expect(optimisticResult[0].tmdbId).toBe(123);
      expect(optimisticResult[0].title).toBe('Loading...');

      // Verify invalidation was called
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['watchlist'] });
    });

    it('should rollback on error', async () => {
      const mockNewEntry: CreateWatchlistEntryData = {
        tmdbId: 123,
        mediaType: 'movie',
        status: 'plan_to_watch',
      };

      const previousWatchlist = [{ id: 'existing', mediaItem: { title: 'Existing' } }];

      mockWatchlistApi.addToWatchlist.mockRejectedValue(new Error('API Error'));
      mockQueryClient.getQueryData.mockReturnValue(previousWatchlist);

      const { useAddToWatchlist } = require('@/lib/hooks/use-watchlist');
      const { mutateAsync } = useAddToWatchlist();

      try {
        await mutateAsync(mockNewEntry);
      } catch (error) {
        // Expected to fail
      }

      // Verify rollback was called
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['watchlist'], previousWatchlist);
    });
  });

  describe('useUpdateWatchlistEntry optimistic updates', () => {
    it('should optimistically update when updating entry', async () => {
      const mockUpdateData: UpdateWatchlistEntryData = {
        status: 'completed',
        rating: 9,
      };

      const existingEntry: WatchlistEntry = {
        id: '1',
        mediaItemId: 'media-1',
        status: 'watching',
        rating: 8,
        mediaItem: {
          id: 'media-1',
          tmdbId: 123,
          title: 'Test Movie',
          mediaType: 'movie',
          posterPath: '/test.jpg',
          releaseDate: '2024-01-01',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        dateAdded: '2024-01-01T00:00:00Z',
        dateUpdated: '2024-01-01T00:00:00Z',
      };

      mockWatchlistApi.updateWatchlistEntry.mockResolvedValue({ ...existingEntry, ...mockUpdateData });
      mockQueryClient.getQueryData.mockReturnValue([existingEntry]);

      const { useUpdateWatchlistEntry } = require('@/lib/hooks/use-watchlist');
      const { mutateAsync } = useUpdateWatchlistEntry();

      await mutateAsync({ id: '1', data: mockUpdateData });

      // Verify optimistic update was called
      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({ queryKey: ['watchlist'] });
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ['watchlist'],
        expect.any(Function)
      );

      // Verify the entry was updated
      const updateFunction = mockQueryClient.setQueryData.mock.calls[0][1];
      const updatedResult = updateFunction([existingEntry]);
      expect(updatedResult[0]).toMatchObject(mockUpdateData);
      expect(updatedResult[0].updatedAt).toBeDefined();

      // Verify invalidation was called
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['watchlist'] });
    });
  });

  describe('useRemoveFromWatchlist optimistic updates', () => {
    it('should optimistically update when removing entry', async () => {
      const existingEntry: WatchlistEntry = {
        id: '1',
        mediaItemId: 'media-1',
        status: 'watching',
        mediaItem: {
          id: 'media-1',
          tmdbId: 123,
          title: 'Test Movie',
          mediaType: 'movie',
          posterPath: '/test.jpg',
          releaseDate: '2024-01-01',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        dateAdded: '2024-01-01T00:00:00Z',
        dateUpdated: '2024-01-01T00:00:00Z',
      };

      mockWatchlistApi.removeFromWatchlist.mockResolvedValue(undefined);
      mockQueryClient.getQueryData.mockReturnValue([existingEntry]);

      const { useRemoveFromWatchlist } = require('@/lib/hooks/use-watchlist');
      const { mutateAsync } = useRemoveFromWatchlist();

      await mutateAsync('1');

      // Verify optimistic update was called
      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({ queryKey: ['watchlist'] });
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ['watchlist'],
        expect.any(Function)
      );

      // Verify the entry was removed
      const updateFunction = mockQueryClient.setQueryData.mock.calls[0][1];
      const updatedResult = updateFunction([existingEntry]);
      expect(updatedResult).toHaveLength(0);

      // Verify invalidation was called
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['watchlist'] });
    });
  });
});