import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RecommendationResult {
  mediaItem: {
    id: string;
    tmdbId: number;
    tmdbType: string;
    title: string;
    description: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: Date | null;
    rating: number | null;
    genres: string[];
    creators: string[];
    createdAt: Date;
    updatedAt: Date;
  } & {
    streamingProviders: any[];
  };
  score: number;
  metadata: {
    familyAvgRating: number | null;
    familyWatchCount: number;
    tmdbRating: number | null;
    watchedBy: Array<{
      userId: string;
      userName: string | null;
      rating: number | null;
      status: string;
    }>;
  };
}

export interface RecommendationCache {
  recommendations: RecommendationResult[];
  timestamp: number;
  ttl: number;
}

// In-memory cache with TTL of 15 minutes
const recommendationCache = new Map<string, RecommendationCache>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

export function clearCache(key?: string): void {
  if (key) {
    recommendationCache.delete(key);
  } else {
    recommendationCache.clear();
  }
}

function getCacheKey(userId: string, familyId?: string): string {
  return familyId ? `${userId}:${familyId}` : userId;
}

function isCacheValid(cache: RecommendationCache): boolean {
  return Date.now() - cache.timestamp < cache.ttl;
}

function getCachedRecommendations(
  userId: string,
  familyId?: string,
): RecommendationResult[] | null {
  const key = getCacheKey(userId, familyId);
  const cached = recommendationCache.get(key);

  if (cached && isCacheValid(cached)) {
    return cached.recommendations;
  }

  if (cached) {
    recommendationCache.delete(key);
  }

  return null;
}

function setCachedRecommendations(
  userId: string,
  recommendations: RecommendationResult[],
  familyId?: string,
): void {
  const key = getCacheKey(userId, familyId);
  recommendationCache.set(key, {
    recommendations,
    timestamp: Date.now(),
    ttl: CACHE_TTL,
  });
}

function calculateScore(
  familyAvgRating: number | null,
  familyWatchCount: number,
  tmdbRating: number | null,
  statusWeights: number[],
): number {
  const avgRatingScore = familyAvgRating ? familyAvgRating * 3 : 0;
  const popularityScore = familyWatchCount * 2;
  const tmdbScore = tmdbRating ? tmdbRating / 2 : 0;
  const avgStatusWeight =
    statusWeights.length > 0 ? statusWeights.reduce((a, b) => a + b, 0) / statusWeights.length : 0;

  return avgRatingScore + popularityScore + tmdbScore + avgStatusWeight;
}

function getStatusWeight(status: string): number {
  switch (status) {
    case 'completed':
      return 2;
    case 'watching':
      return 1;
    case 'not_watched':
    default:
      return 0;
  }
}

export async function generateRecommendations(
  userId: string,
  familyId?: string,
  useCache: boolean = true,
): Promise<RecommendationResult[]> {
  // Check cache first
  if (useCache) {
    const cached = getCachedRecommendations(userId, familyId);
    if (cached) {
      return cached;
    }
  }

  // Get user's families
  const userFamilies = await prisma.familyMembership.findMany({
    where: {
      userId,
      ...(familyId && { familyId }),
    },
    select: {
      familyId: true,
    },
  });

  if (userFamilies.length === 0) {
    return [];
  }

  const familyIds = userFamilies.map((f: any) => f.familyId);

  // Get user's existing watchlist items (to exclude them)
  const userWatchlist = await prisma.watchlistEntry.findMany({
    where: {
      userId,
    },
    select: {
      mediaItemId: true,
    },
  });

  const userMediaIds = new Set(userWatchlist.map((w: any) => w.mediaItemId));

  // Get all watchlist entries from family members (excluding the current user)
  const familyWatchlistEntries = await prisma.watchlistEntry.findMany({
    where: {
      userId: { not: userId },
      user: {
        familyMemberships: {
          some: {
            familyId: { in: familyIds },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      mediaItem: {
        include: {
          streamingProviders: true,
        },
      },
    },
  });

  // Group entries by media item
  const mediaItemMap = new Map<
    string,
    {
      mediaItem: {
        id: string;
        tmdbId: number;
        tmdbType: string;
        title: string;
        description: string | null;
        posterPath: string | null;
        backdropPath: string | null;
        releaseDate: Date | null;
        rating: number | null;
        genres: string[];
        creators: string[];
        createdAt: Date;
        updatedAt: Date;
      } & { streamingProviders: any[] };
      entries: Array<{
        id: string;
        userId: string;
        mediaItemId: string;
        status: string;
        rating: number | null;
        notes: string | null;
        dateAdded: Date;
        dateUpdated: Date;
        user: { id: string; name: string | null };
      }>;
    }
  >();

  for (const entry of familyWatchlistEntries) {
    // Skip items user already has in their watchlist
    if (userMediaIds.has(entry.mediaItemId)) {
      continue;
    }

    if (!mediaItemMap.has(entry.mediaItemId)) {
      mediaItemMap.set(entry.mediaItemId, {
        mediaItem: entry.mediaItem,
        entries: [],
      });
    }

    mediaItemMap.get(entry.mediaItemId)!.entries.push(entry);
  }

  // Calculate scores for each media item
  const recommendations: RecommendationResult[] = [];

  for (const { mediaItem, entries } of mediaItemMap.values()) {
    const ratings = entries.filter((e) => e.rating !== null).map((e) => e.rating as number);

    const familyAvgRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    const familyWatchCount = entries.length;
    const tmdbRating = mediaItem.rating;
    const statusWeights = entries.map((e) => getStatusWeight(e.status));

    const score = calculateScore(familyAvgRating, familyWatchCount, tmdbRating, statusWeights);

    recommendations.push({
      mediaItem,
      score,
      metadata: {
        familyAvgRating,
        familyWatchCount,
        tmdbRating,
        watchedBy: entries.map((e) => ({
          userId: e.user.id,
          userName: e.user.name,
          rating: e.rating,
          status: e.status,
        })),
      },
    });
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  // Cache the results
  if (useCache) {
    setCachedRecommendations(userId, recommendations, familyId);
  }

  return recommendations;
}
