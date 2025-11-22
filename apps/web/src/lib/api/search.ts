import { apiClient } from './client';

export interface SearchResult {
  id: number;
  title: string;
  mediaType: 'movie' | 'tv';
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: string;
  overview?: string;
  voteAverage?: number;
  genres?: number[];
}

export const searchApi = {
  async search(query: string): Promise<SearchResult[]> {
    const response = await apiClient.get('/search', {
      params: { query },
    });
    return response.data.data;
  },
};
