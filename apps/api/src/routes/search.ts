import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { tmdbService, MediaType, SearchResult, MediaDetails } from '../services/tmdbService';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../services/cacheService';

const router: Router = Router();
const prisma = new PrismaClient();

const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  include_adult: z.coerce.boolean().default(false),
});

const MediaDetailsParamsSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
});

const MediaDetailsQuerySchema = z.object({
  type: z.enum(['movie', 'tv']).default('movie'),
  language: z.string().optional(),
});

function normalizeSearchResult(result: SearchResult): SearchResult {
  return {
    ...result,
    posterPath: result.poster_path,
    backdropPath: result.backdrop_path,
    releaseDate: result.release_date,
    voteAverage: result.vote_average,
    genreIds: result.genre_ids,
    mediaType: result.media_type,
    poster_path: result.poster_path,
    backdrop_path: result.backdrop_path,
    release_date: result.release_date,
    vote_average: result.vote_average,
    genre_ids: result.genre_ids,
    media_type: result.media_type,
  };
}

async function enrichSearchResults(results: SearchResult[]): Promise<SearchResult[]> {
  const enrichedResults: SearchResult[] = [];
  for (const result of results) {
    const existingMedia = await prisma.mediaItem.findUnique({
      where: { tmdbId: result.id },
      include: {
        streamingProviders: true,
      },
    });
    const enrichedResult = normalizeSearchResult(result);
    if (existingMedia) {
      enrichedResult.streamingProviders =
        existingMedia.streamingProviders?.map((provider) => ({
          provider_id: provider.provider,
          provider_name: provider.provider,
          logo_path: null,
          regions: provider.regions,
        })) || [];
      enrichedResult.inDatabase = true;
    }
    enrichedResults.push(enrichedResult);
  }
  return enrichedResults;
}

async function enrichMediaDetails(details: MediaDetails): Promise<MediaDetails> {
  const existingMedia = await prisma.mediaItem.findUnique({
    where: { tmdbId: details.id },
    include: {
      streamingProviders: true,
    },
  });

  if (existingMedia) {
    const ourProviders = existingMedia.streamingProviders?.map((provider) => ({
      provider_id: provider.provider,
      provider_name: provider.provider,
      logo_path: null,
      regions: provider.regions,
    }));

    return {
      ...details,
      streamingProviders: details.watch_providers
        ? ({
            ...details.watch_providers,
            cached: ourProviders || [],
          } as any)
        : ((ourProviders || []) as any),
      inDatabase: true,
    };
  }

  return details;
}

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, page, include_adult } = SearchQuerySchema.parse(req.query);
    const cacheKey = `search:${query}:${page}:${include_adult}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const searchResponse = await tmdbService.searchMulti(query, page);
    const enrichedResults = await enrichSearchResults(searchResponse.results);
    const response = {
      data: enrichedResults,
      page: searchResponse.page,
      totalPages: searchResponse.total_pages,
      totalResults: searchResponse.total_results,
      cached: false,
    };
    cacheService.set(cacheKey, response, 300);
    return res.json(response);
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }

    const cacheKey = `search:${req.query.query}:${req.query.page || 1}:${req.query.include_adult || false}`;
    const staleCache = cacheService.get(cacheKey) as any;
    if (staleCache) {
      if (staleCache.results && !staleCache.data) {
        return res.json({
          data: staleCache.results,
          page: staleCache.page,
          totalPages: staleCache.total_pages,
          totalResults: staleCache.total_results,
          cached: true,
          stale: true,
          warning: 'Using cached data due to TMDB API unavailability',
        });
      }
      return res.json({
        ...staleCache,
        cached: true,
        stale: true,
        warning: 'Using cached data due to TMDB API unavailability',
      });
    }

    return res.status(500).json({
      error: 'Failed to perform search',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/media/:tmdbId', async (req: Request, res: Response) => {
  try {
    const { tmdbId } = MediaDetailsParamsSchema.parse(req.params);
    const { type, language } = MediaDetailsQuerySchema.parse(req.query);
    const cacheKey = `media:${tmdbId}:${type}${language ? `:${language}` : ''}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const details = await tmdbService.getMediaDetails(tmdbId, type);
    const enrichedDetails = await enrichMediaDetails(details);
    cacheService.set(cacheKey, enrichedDetails, 1800);
    return res.json(enrichedDetails);
  } catch (error) {
    console.error('Media details error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: error.errors,
      });
    }

    const { tmdbId } = req.params;
    const { type = 'movie' } = req.query;
    const cacheKey = `media:${tmdbId}:${type}`;
    const staleCache = cacheService.get(cacheKey) as any;
    if (staleCache) {
      return res.json({
        ...staleCache,
        cached: true,
        stale: true,
        warning: 'Using cached data due to TMDB API unavailability',
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch media details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/genres/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be "movie" or "tv"',
      });
    }

    const cacheKey = `genres:${type}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const genres = await tmdbService.getGenres(type as MediaType);
    cacheService.set(cacheKey, genres, 86400);
    return res.json({ genres });
  } catch (error) {
    console.error('Genres error:', error);

    const cacheKey = `genres:${req.params.type}`;
    const staleCache = cacheService.get(cacheKey) as any;
    if (staleCache) {
      return res.json({
        ...staleCache,
        cached: true,
        stale: true,
        warning: 'Using cached data due to TMDB API unavailability',
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch genres',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/cache/clear', async (_req: Request, res: Response) => {
  try {
    cacheService.clear();
    return res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Cache clear error:', error);
    return res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/cache/stats', async (_req: Request, res: Response) => {
  try {
    const stats = cacheService.getStats();
    return res.json(stats);
  } catch (error) {
    console.error('Cache stats error:', error);
    return res.status(500).json({
      error: 'Failed to get cache statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as searchRouter };