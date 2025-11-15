import { filterAndSortWatchlist, groupWatchlistByStatus, extractEpisodeProgress, formatEpisodeProgress } from '../watchlist-utils';
import type { WatchlistEntry } from '@/lib/api/watchlist';

const mockEntries: WatchlistEntry[] = [
  {
    id: '1',
    mediaItemId: 'media-1',
    status: 'watching',
    rating: 8,
    notes: 'Great movie!',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    dateAdded: '2024-01-01T00:00:00Z',
    dateUpdated: '2024-01-01T00:00:00Z',
    mediaItem: {
      id: 'media-1',
      tmdbId: 123,
      title: 'A Movie',
      mediaType: 'movie',
      posterPath: '/test-poster.jpg',
      releaseDate: '2024-01-01',
    },
  },
  {
    id: '2',
    mediaItemId: 'media-2',
    status: 'completed',
    rating: 9,
    notes: 'Excellent show!',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    dateAdded: '2024-01-02T00:00:00Z',
    dateUpdated: '2024-01-02T00:00:00Z',
    mediaItem: {
      id: 'media-2',
      tmdbId: 456,
      title: 'B Show',
      mediaType: 'tv',
      posterPath: '/test-poster-2.jpg',
      releaseDate: '2024-01-02',
    },
  },
  {
    id: '3',
    mediaItemId: 'media-3',
    status: 'not_watched',
    rating: undefined,
    notes: 'Progress: 5/10 episodes',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    dateAdded: '2024-01-03T00:00:00Z',
    dateUpdated: '2024-01-03T00:00:00Z',
    mediaItem: {
      id: 'media-3',
      tmdbId: 789,
      title: 'C Series',
      mediaType: 'tv',
      posterPath: '/test-poster-3.jpg',
      releaseDate: '2024-01-03',
    },
  },
];

describe('watchlist-utils', () => {
  describe('filterAndSortWatchlist', () => {
    it('returns all entries when status filter is "all"', () => {
      const result = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'all',
        sortBy: 'dateAdded_desc'
      });

      expect(result).toHaveLength(3);
    });

    it('filters by status correctly', () => {
      const watching = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'watching',
        sortBy: 'dateAdded_desc'
      });

      expect(watching).toHaveLength(1);
      expect(watching[0].status).toBe('watching');
    });

    it('sorts by dateAdded descending', () => {
      const result = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'all',
        sortBy: 'dateAdded_desc'
      });

      expect(result[0].mediaItem.title).toBe('C Series');
      expect(result[1].mediaItem.title).toBe('B Show');
      expect(result[2].mediaItem.title).toBe('A Movie');
    });

    it('sorts by dateAdded ascending', () => {
      const result = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'all',
        sortBy: 'dateAdded_asc'
      });

      expect(result[0].mediaItem.title).toBe('A Movie');
      expect(result[1].mediaItem.title).toBe('B Show');
      expect(result[2].mediaItem.title).toBe('C Series');
    });

    it('sorts by title ascending', () => {
      const result = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'all',
        sortBy: 'title_asc'
      });

      expect(result[0].mediaItem.title).toBe('A Movie');
      expect(result[1].mediaItem.title).toBe('B Show');
      expect(result[2].mediaItem.title).toBe('C Series');
    });

    it('sorts by title descending', () => {
      const result = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'all',
        sortBy: 'title_desc'
      });

      expect(result[0].mediaItem.title).toBe('C Series');
      expect(result[1].mediaItem.title).toBe('B Show');
      expect(result[2].mediaItem.title).toBe('A Movie');
    });

    it('sorts by rating descending', () => {
      const result = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'all',
        sortBy: 'rating_desc'
      });

      expect(result[0].rating).toBe(9);
      expect(result[1].rating).toBe(8);
      expect(result[2].rating).toBeUndefined();
    });

    it('sorts by rating ascending', () => {
      const result = filterAndSortWatchlist(mockEntries, {
        statusFilter: 'all',
        sortBy: 'rating_asc'
      });

      expect(result[0].rating).toBeUndefined();
      expect(result[1].rating).toBe(8);
      expect(result[2].rating).toBe(9);
    });
  });

  describe('groupWatchlistByStatus', () => {
    it('groups entries by status correctly', () => {
      const groups = groupWatchlistByStatus(mockEntries);

      expect(groups.not_watched).toHaveLength(1);
      expect(groups.not_watched[0].mediaItem.title).toBe('C Series');

      expect(groups.watching).toHaveLength(1);
      expect(groups.watching[0].mediaItem.title).toBe('A Movie');

      expect(groups.completed).toHaveLength(1);
      expect(groups.completed[0].mediaItem.title).toBe('B Show');
    });

    it('handles empty array', () => {
      const groups = groupWatchlistByStatus([]);

      expect(groups.not_watched).toHaveLength(0);
      expect(groups.watching).toHaveLength(0);
      expect(groups.completed).toHaveLength(0);
    });
  });

  describe('extractEpisodeProgress', () => {
    it('extracts episode progress from notes', () => {
      const notes = 'Great show! Progress: 5/10 episodes';
      const progress = extractEpisodeProgress(notes);

      expect(progress).toEqual({ watched: 5, total: 10 });
    });

    it('extracts episode progress with singular "episode"', () => {
      const notes = 'Progress: 1/8 episode';
      const progress = extractEpisodeProgress(notes);

      expect(progress).toEqual({ watched: 1, total: 8 });
    });

    it('handles case insensitive matching', () => {
      const notes = 'PROGRESS: 3/12 EPISODES';
      const progress = extractEpisodeProgress(notes);

      expect(progress).toEqual({ watched: 3, total: 12 });
    });

    it('returns null when no progress found', () => {
      const notes = 'Great movie without episodes';
      const progress = extractEpisodeProgress(notes);

      expect(progress).toBeNull();
    });

    it('returns null for empty notes', () => {
      const progress = extractEpisodeProgress();

      expect(progress).toBeNull();
    });

    it('returns null for undefined notes', () => {
      const progress = extractEpisodeProgress(undefined);

      expect(progress).toBeNull();
    });
  });

  describe('formatEpisodeProgress', () => {
    it('formats progress with total episodes', () => {
      const result = formatEpisodeProgress(5, 10);
      expect(result).toBe('5/10 episodes');
    });

    it('formats progress with singular "episode"', () => {
      const result = formatEpisodeProgress(1, 1);
      expect(result).toBe('1/1 episodes');
    });

    it('formats progress with zero total episodes', () => {
      const result = formatEpisodeProgress(5, 0);
      expect(result).toBe('5 episodes');
    });

    it('formats progress with zero watched episodes', () => {
      const result = formatEpisodeProgress(0, 10);
      expect(result).toBe('0/10 episodes');
    });
  });
});