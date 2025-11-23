import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';
import { z } from 'zod';

// TMDB API response schemas
export const TMDBMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().nullable(),
  vote_average: z.number().nullable(),
  genre_ids: z.array(z.number()),
  adult: z.boolean().optional(),
  original_language: z.string().optional(),
  popularity: z.number().optional(),
  video: z.boolean().optional(),
  vote_count: z.number().optional(),
});

export const TMDBTVSchema = z.object({
  id: z.number(),
  name: z.string(),
  overview: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  first_air_date: z.string().nullable(),
  vote_average: z.number().nullable(),
  genre_ids: z.array(z.number()),
  adult: z.boolean().optional(),
  original_language: z.string().optional(),
  popularity: z.number().optional(),
  origin_country: z.array(z.string()).optional(),
  vote_count: z.number().optional(),
});

export const TMDBSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(z.union([TMDBMovieSchema, TMDBTVSchema])),
  total_results: z.number(),
  total_pages: z.number(),
});

export const TMDBGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const TMDBGenresResponseSchema = z.object({
  genres: z.array(TMDBGenreSchema),
});

export const TMDBWatchProviderSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string().nullable(),
});

export const TMDBWatchProvidersResponseSchema = z.object({
  results: z.record(z.object({
    flatrate: z.array(TMDBWatchProviderSchema).optional(),
    buy: z.array(TMDBWatchProviderSchema).optional(),
    rent: z.array(TMDBWatchProviderSchema).optional(),
  })),
});

// Type definitions
export type TMDBMovie = z.infer<typeof TMDBMovieSchema>;
export type TMDBTV = z.infer<typeof TMDBTVSchema>;
export type TMDBSearchResponse = z.infer<typeof TMDBSearchResponseSchema>;
export type TMDBGenre = z.infer<typeof TMDBGenreSchema>;
export type TMDBWatchProvider = z.infer<typeof TMDBWatchProviderSchema>;
export type TMDBWatchProvidersResponse = z.infer<typeof TMDBWatchProvidersResponseSchema>;

export type MediaType = 'movie' | 'tv';

export interface SearchResult {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  genre_ids: number[];
  media_type: MediaType;
}

export interface MediaDetails extends SearchResult {
  adult?: boolean;
  original_language?: string;
  popularity?: number;
  video?: boolean;
  vote_count?: number;
  genres?: TMDBGenre[];
  watch_providers?: TMDBWatchProvidersResponse;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
}

export interface TMDBError {
  status_message: string;
  status_code: number;
}

export class TMDBService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private readonly API_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly CACHE_TTL = {
    SEARCH: 300, // 5 minutes
    DETAILS: 1800, // 30 minutes
    GENRES: 86400, // 24 hours
    PROVIDERS: 3600, // 1 hour
  };

  constructor() {
    if (!process.env.TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.API_BASE_URL,
      params: {
        api_key: process.env.TMDB_API_KEY,
      },
      timeout: 10000, // 10 second timeout
    });

    // Initialize cache with standard TTL and check period
    this.cache = new NodeCache({
      stdTTL: this.CACHE_TTL.SEARCH,
      checkperiod: 600, // Check for expired keys every 10 minutes
    });

    // Set up rate limiting
    this.setupRateLimiting();
  }

  private setupRateLimiting() {
    // TMDB allows ~40 requests per 10 seconds
    const requestTimes: number[] = [];
    const MAX_REQUESTS = 40;
    const TIME_WINDOW = 10000; // 10 seconds in milliseconds

    this.client.interceptors.request.use(
      (config) => {
        const now = Date.now();
        
        // Remove old requests outside the time window
        const recentRequests = requestTimes.filter(time => now - time < TIME_WINDOW);
        
        if (recentRequests.length >= MAX_REQUESTS) {
          const oldestRequest = Math.min(...recentRequests);
          const waitTime = TIME_WINDOW - (now - oldestRequest);
          
          if (waitTime > 0) {
            throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
          }
        }
        
        requestTimes.push(now);
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private getCacheKey(endpoint: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}${paramString ? `?${paramString}` : ''}`;
  }

  private async get<T>(endpoint: string, params: Record<string, any> = {}, cacheTTL?: number): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Try to get from cache first
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const response = await this.client.get(endpoint, { params });
      const data = response.data;
      
      // Cache the response
      const ttl = cacheTTL || this.CACHE_TTL.SEARCH;
      this.cache.set(cacheKey, data, ttl);
      
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const tmdbError = error.response?.data as TMDBError;
        if (tmdbError) {
          throw new Error(`TMDB API Error: ${tmdbError.status_message} (${tmdbError.status_code})`);
        }
        throw new Error(`TMDB API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async searchMulti(query: string, page: number = 1): Promise<TMDBSearchResponse> {
    if (!query.trim()) {
      throw new Error('Search query cannot be empty');
    }

    const params = {
      query: query.trim(),
      page,
      include_adult: false,
    };

    const response = await this.get<TMDBSearchResponse>('/search/multi', params, this.CACHE_TTL.SEARCH);
    
    // Validate response
    const validated = TMDBSearchResponseSchema.parse(response);
    
    // Transform results to include media_type
    const transformedResults = validated.results.map(result => {
      if ('title' in result) {
        return { ...result, media_type: 'movie' as MediaType };
      } else if ('name' in result) {
        return { ...result, media_type: 'tv' as MediaType };
      }
      return result;
    });

    return {
      ...validated,
      results: transformedResults,
    };
  }

  async getMovieDetails(tmdbId: number): Promise<MediaDetails> {
    const [movieData, providersData] = await Promise.all([
      this.get(`/movie/${tmdbId}`, { append_to_response: 'genres' }, this.CACHE_TTL.DETAILS),
      this.get(`/movie/${tmdbId}/watch/providers`, {}, this.CACHE_TTL.PROVIDERS),
    ]);

    const movie = TMDBMovieSchema.parse(movieData);
    const providers = TMDBWatchProvidersResponseSchema.parse(providersData);

    return {
      ...movie,
      media_type: 'movie',
      watch_providers: providers,
    };
  }

  async getTVDetails(tmdbId: number): Promise<MediaDetails> {
    const [tvData, providersData] = await Promise.all([
      this.get(`/tv/${tmdbId}`, { append_to_response: 'genres' }, this.CACHE_TTL.DETAILS),
      this.get(`/tv/${tmdbId}/watch/providers`, {}, this.CACHE_TTL.PROVIDERS),
    ]);

    const tv = TMDBTVSchema.parse(tvData);
    const providers = TMDBWatchProvidersResponseSchema.parse(providersData);

    return {
      ...tv,
      title: tv.name,
      release_date: tv.first_air_date,
      media_type: 'tv',
      watch_providers: providers,
    };
  }

  async getMediaDetails(tmdbId: number, mediaType: MediaType): Promise<MediaDetails> {
    if (mediaType === 'movie') {
      return this.getMovieDetails(tmdbId);
    } else if (mediaType === 'tv') {
      return this.getTVDetails(tmdbId);
    }
    throw new Error(`Invalid media type: ${mediaType}`);
  }

  async getGenres(mediaType: MediaType): Promise<TMDBGenre[]> {
    const response = await this.get<typeof TMDBGenresResponseSchema>(`/genre/${mediaType}/list`, {}, this.CACHE_TTL.GENRES);
    return response.genres;
  }

  // Cache management methods
  clearCache(): void {
    this.cache.flushAll();
  }

  deleteCacheKey(key: string): void {
    this.cache.del(key);
  }

  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
    };
  }

  // Fallback method for when TMDB API is unavailable
  async getFromCacheOnly<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    const cacheKey = this.getCacheKey(endpoint, params);
    return this.cache.get<T>(cacheKey) || null;
  }
}

// Singleton instance
export const tmdbService = new TMDBService();