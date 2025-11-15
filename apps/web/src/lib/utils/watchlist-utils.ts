import type { WatchlistEntry } from '@/lib/api/watchlist';

export type StatusFilter = 'all' | 'not_watched' | 'watching' | 'completed';
export type SortOption = 'dateAdded_desc' | 'dateAdded_asc' | 'title_asc' | 'title_desc' | 'rating_desc' | 'rating_asc';

export interface FilterOptions {
  statusFilter: StatusFilter;
  sortBy: SortOption;
}

export function filterAndSortWatchlist(
  entries: WatchlistEntry[],
  { statusFilter, sortBy }: FilterOptions
): WatchlistEntry[] {
  // Filter by status
  let filtered = entries.filter(entry => {
    if (statusFilter === 'all') return true;
    return entry.status === statusFilter;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'dateAdded_desc':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      case 'dateAdded_asc':
        return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      case 'title_asc':
        return a.mediaItem.title.localeCompare(b.mediaItem.title);
      case 'title_desc':
        return b.mediaItem.title.localeCompare(a.mediaItem.title);
      case 'rating_desc':
        // Handle undefined ratings
        const aRating = a.rating ?? -1;
        const bRating = b.rating ?? -1;
        return bRating - aRating;
      case 'rating_asc':
        const aRatingAsc = a.rating ?? 999;
        const bRatingAsc = b.rating ?? 999;
        return aRatingAsc - bRatingAsc;
      default:
        return 0;
    }
  });

  return filtered;
}

export function groupWatchlistByStatus(entries: WatchlistEntry[]) {
  const groups = {
    not_watched: entries.filter(entry => entry.status === 'not_watched'),
    watching: entries.filter(entry => entry.status === 'watching'),
    completed: entries.filter(entry => entry.status === 'completed'),
  };

  return groups;
}

export function extractEpisodeProgress(notes?: string): { watched: number; total: number } | null {
  if (!notes) return null;
  
  const progressMatch = notes.match(/Progress:\s*(\d+)\/(\d+)\s*episodes?/i);
  if (!progressMatch) return null;
  
  return {
    watched: parseInt(progressMatch[1], 10),
    total: parseInt(progressMatch[2], 10),
  };
}

export function formatEpisodeProgress(watched: number, total: number): string {
  if (total === 0) return `${watched} episodes`;
  return `${watched}/${total} episodes`;
}