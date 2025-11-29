import { apiClient } from './client';
import type {
  NormalizedPreviewItem,
  BulkImportRequest,
  ImportResult,
  ExportResponse,
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
      ...data,
      tmdbType: data.mediaType,
      status: data.status || 'not_watched',
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

  async getWatchlistStats(): Promise<{
    total: number;
    not_watched: number;
    watching: number;
    completed: number;
  }> {
    const response = await apiClient.get('/watchlist/stats');
    return response.data;
  },

  async previewImport(file: ArrayBuffer | string): Promise<NormalizedPreviewItem[]> {
    const formData = new FormData();
    const fileBlob = new Blob([file as any], {
      type: typeof file === 'string' ? 'text/csv' : 'application/octet-stream',
      lastModified: Date.now(),
    });

    formData.append('file', fileBlob as any);

    const response = await apiClient.post('/watchlist/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    return response.data.data || response.data.items || [];
  },

  async confirmImport(request: BulkImportRequest): Promise<ImportResult> {
    const response = await apiClient.post('/watchlist/import/confirm', request);
    return response.data.data || response.data;
  },

  async exportWatchlist(format: 'csv' | 'json' = 'json'): Promise<ExportResponse> {
    const response = await apiClient.get('/watchlist/export', {
      params: { format },
    });
    return response.data.data || response.data;
  },

  async exportWatchlistAsFile(format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const response = await apiClient.get('/watchlist/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
