import { apiClient } from './client';

export interface SearchResult {
  id: number;
  title: string;
  mediaType: 'movie' | 'tv';
  posterPath?: string;
  releaseDate?: string;
  overview?: string;
  voteAverage?: number;
}

export const searchApi = {
  async search(query: string): Promise<SearchResult[]> {
    const response = await apiClient.get('/search', {
      params: { query },
    });
    return response.data.data;
  },
};
