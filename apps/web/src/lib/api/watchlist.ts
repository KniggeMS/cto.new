import { apiClient } from './client';
import type {
  NormalizedPreviewItem,
  BulkImportRequest,
  ImportResult,
} from '@infocus/shared';

export interface WatchlistEntry {
  id: string;
  mediaItemId: string;
  status: 'not_watched' | 'watching' | 'completed';
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  dateAdded: string;
  dateUpdated: string;
  mediaItem: {
    id: string;
    tmdbId: number;
    title: string;
    mediaType: 'movie' | 'tv';
    posterPath?: string;
    releaseDate?: string;
    description?: string;
    rating?: number;
    genres?: string[];
    creators?: string[];
    streamingProviders?: Array<{
      id: string;
      provider: string;
      url?: string;
      regions?: string[];
    }>;
  };
}

export interface CreateWatchlistEntryData {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  status?: 'not_watched' | 'watching' | 'completed';
  rating?: number;
  notes?: string;
  metadata?: {
    title: string;
    description?: string | null;
    posterPath?: string | null;
    backdropPath?: string | null;
    releaseDate?: string | null;
    rating?: number | null;
    genres?: string[];
    creators?: string[];
    streamingProviders?: Array<{
      provider: string;
      url?: string | null;
      regions?: string[];
    }>;
  };
}

export interface UpdateWatchlistEntryData {
  status?: 'not_watched' | 'watching' | 'completed';
  rating?: number;
  notes?: string;
}

export const watchlistApi = {
  async getWatchlist(): Promise<WatchlistEntry[]> {
    const response = await apiClient.get('/watchlist');
    return response.data.data;
  },

  async addToWatchlist(data: CreateWatchlistEntryData): Promise<WatchlistEntry> {
    const response = await apiClient.post('/watchlist', {
      tmdbId: data.tmdbId,
      tmdbType: data.mediaType,
      status: data.status || 'not_watched',
      rating: data.rating,
      notes: data.notes,
      metadata: data.metadata,
    });
    return response.data.data;
  },

  async updateWatchlistEntry(id: string, data: UpdateWatchlistEntryData): Promise<WatchlistEntry> {
    const response = await apiClient.patch(`/watchlist/${id}`, data);
    return response.data.data;
  },

  async removeFromWatchlist(id: string): Promise<void> {
    await apiClient.delete(`/watchlist/${id}`);
  },

  // Import/Export methods
  async importWatchlistPreview(file: File): Promise<NormalizedPreviewItem[]> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/watchlist/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  async confirmWatchlistImport(request: BulkImportRequest): Promise<ImportResult> {
    const response = await apiClient.post('/watchlist/import/confirm', request);
    return response.data.data;
  },

  async exportWatchlist(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/watchlist/export?format=${format}`, {
      responseType: 'blob',
    });

    return response.data;
  },
};
