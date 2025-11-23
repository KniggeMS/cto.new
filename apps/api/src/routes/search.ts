import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { tmdbService, MediaType, SearchResult, MediaDetails } from '../services/tmdbService';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../services/cacheService';

const router: Router = Router();
const prisma = new PrismaClient();

// Query parameter schemas
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

// Helper function to enrich search results with provider data
async function enrichSearchResults(results: SearchResult[]): Promise<SearchResult[]> {
  const enrichedResults: SearchResult[] = [];

  for (const result of results) {
    // Check if we have this media item in our database
    const existingMedia = await prisma.mediaItem.findUnique({
      where: { tmdbId: result.id },
      include: {
        streamingProviders: true,
      },
    });

    const enrichedResult: SearchResult = { ...result };

    if (existingMedia) {
      // Add streaming provider info from our database
      enrichedResult.streamingProviders = existingMedia.streamingProviders?.map(provider => ({
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

// Helper function to enrich media details with provider data
async function enrichMediaDetails(details: MediaDetails): Promise<MediaDetails> {
  // Check if we have this media item in our database
  const existingMedia = await prisma.mediaItem.findUnique({
    where: { tmdbId: details.id },
    include: {
      streamingProviders: true,
    },
  });

  if (existingMedia) {
    // Merge TMDB provider data with our cached provider data
    const ourProviders = existingMedia.streamingProviders?.map(provider => ({
      provider_id: provider.provider,
      provider_name: provider.provider,
      logo_path: null,
      regions: provider.regions,
    }));

    return {
      ...details,
      streamingProviders: details.watch_providers ? {
        ...details.watch_providers,
        cached: ourProviders || [],
      } as any : (ourProviders || []) as any,
      inDatabase: true,
    };
  }

  return details;
}

// GET /search - Search for movies and TV shows
router.get('/search', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const { query, page, include_adult } = SearchQuerySchema.parse(req.query);

    // Create cache key for this search
    const cacheKey = `search:${query}:${page}:${include_adult}`;
    
    // Try to get from cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Perform search through TMDB service
    const searchResponse = await tmdbService.searchMulti(query, page);
    
    // Enrich results with our cached provider data
    const enrichedResults = await enrichSearchResults(searchResponse.results);

    const response = {
      ...searchResponse,
      results: enrichedResults,
      cached: false,
    };

    // Cache the response for 5 minutes
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

    // Try to get stale cache if TMDB is down
    const cacheKey = `search:${req.query.query}:${req.query.page || 1}:${req.query.include_adult || false}`;
    const staleCache = cacheService.get(cacheKey);
    if (staleCache) {
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

// GET /media/:tmdbId - Get detailed information about a specific movie or TV show
router.get('/media/:tmdbId', async (req: Request, res: Response) => {
  try {
    // Validate parameters
    const { tmdbId } = MediaDetailsParamsSchema.parse(req.params);
    const { type, language } = MediaDetailsQuerySchema.parse(req.query);

    // Create cache key for this request
    const cacheKey = `media:${tmdbId}:${type}${language ? `:${language}` : ''}`;
    
    // Try to get from cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get media details from TMDB service
    const details = await tmdbService.getMediaDetails(tmdbId, type);
    
    // Enrich with our cached provider data
    const enrichedDetails = await enrichMediaDetails(details);

    // Cache the response for 30 minutes
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

    // Try to get stale cache if TMDB is down
    const { tmdbId } = req.params;
    const { type = 'movie' } = req.query;
    const cacheKey = `media:${tmdbId}:${type}`;
    const staleCache = cacheService.get(cacheKey);
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

// GET /genres/:type - Get list of genres for movies or TV shows
router.get('/genres/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be "movie" or "tv"',
      });
    }

    // Create cache key
    const cacheKey = `genres:${type}`;
    
    // Try to get from cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get genres from TMDB service
    const genres = await tmdbService.getGenres(type as MediaType);

    // Cache for 24 hours
    cacheService.set(cacheKey, genres, 86400);

    return res.json({ genres });
  } catch (error) {
    console.error('Genres error:', error);
    
    // Try to get stale cache
    const cacheKey = `genres:${req.params.type}`;
    const staleCache = cacheService.get(cacheKey);
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

// POST /cache/clear - Clear cache (for debugging/admin purposes)
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

// GET /cache/stats - Get cache statistics
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