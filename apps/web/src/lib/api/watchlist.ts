import { apiClient } from './client';

export interface WatchlistEntry {
  id: string;
  mediaItemId: string;
  status: 'watching' | 'completed' | 'plan_to_watch';
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  mediaItem: {
    id: string;
    tmdbId: number;
    title: string;
    mediaType: 'movie' | 'tv';
    posterPath?: string;
    releaseDate?: string;
  };
}

export interface CreateWatchlistEntryData {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  status: 'watching' | 'completed' | 'plan_to_watch';
  rating?: number;
  notes?: string;
}

export interface UpdateWatchlistEntryData {
  status?: 'watching' | 'completed' | 'plan_to_watch';
  rating?: number;
  notes?: string;
}

export const watchlistApi = {
  async getWatchlist(): Promise<WatchlistEntry[]> {
    const response = await apiClient.get('/watchlist');
    return response.data.data;
  },

  async addToWatchlist(data: CreateWatchlistEntryData): Promise<WatchlistEntry> {
    const response = await apiClient.post('/watchlist', data);
    return response.data.data;
  },

  async updateWatchlistEntry(id: string, data: UpdateWatchlistEntryData): Promise<WatchlistEntry> {
    const response = await apiClient.patch(`/watchlist/${id}`, data);
    return response.data.data;
  },

  async removeFromWatchlist(id: string): Promise<void> {
    await apiClient.delete(`/watchlist/${id}`);
  },
};
