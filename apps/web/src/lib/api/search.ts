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
  genreIds?: number[];
  // Keep snake_case for backward compatibility during transition
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number | null;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
  streamingProviders?: any[];
  inDatabase?: boolean;
}

export interface SearchResponse {
  data: SearchResult[];
  page: number;
  totalPages: number;
  totalResults: number;
  cached?: boolean;
  stale?: boolean;
  warning?: string;
}

export const searchApi = {
  async search(query: string, page: number = 1): Promise<SearchResponse> {
    const response = await apiClient.get('/search', {
      params: { query, page },
    });
    return response.data;
  },
};
