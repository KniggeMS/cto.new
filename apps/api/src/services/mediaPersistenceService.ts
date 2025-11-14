import { PrismaClient } from '@prisma/client';
import { tmdbService, MediaDetails, MediaType } from './tmdbService';

export interface CreateMediaItemData {
  tmdbId: number;
  tmdbType: MediaType;
  title: string;
  description?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: Date;
  rating?: number;
  genres?: string[];
  creators?: string[];
}

export interface CreateStreamingProviderData {
  mediaItemId: string;
  provider: string;
  url?: string;
  regions: string[];
}

export class MediaPersistenceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Fetches detailed media information from TMDB and persists it to the database
   */
  async persistMediaItem(tmdbId: number, mediaType: MediaType): Promise<{ mediaItem: any; isNew: boolean }> {
    // Check if media item already exists
    const existingMedia = await this.prisma.mediaItem.findUnique({
      where: { tmdbId },
      include: { streamingProviders: true },
    });

    if (existingMedia) {
      return { mediaItem: existingMedia, isNew: false };
    }

    // Fetch detailed information from TMDB
    const mediaDetails = await tmdbService.getMediaDetails(tmdbId, mediaType);

    // Transform TMDB data to our database schema
    const mediaItemData: CreateMediaItemData = {
      tmdbId: mediaDetails.id,
      tmdbType: mediaType,
      title: mediaDetails.title,
      description: mediaDetails.overview || undefined,
      posterPath: mediaDetails.poster_path || undefined,
      backdropPath: mediaDetails.backdrop_path || undefined,
      releaseDate: mediaDetails.release_date ? new Date(mediaDetails.release_date) : undefined,
      rating: mediaDetails.vote_average || undefined,
      genres: mediaDetails.genres?.map(genre => genre.name) || [],
      creators: [], // This would need additional API calls to get directors/creators
    };

    // Create media item in database
    const mediaItem = await this.prisma.mediaItem.create({
      data: mediaItemData,
      include: { streamingProviders: true },
    });

    // Extract and persist streaming provider information
    if (mediaDetails.watch_providers) {
      await this.persistStreamingProviders(mediaItem.id, mediaDetails.watch_providers);
    }

    // Fetch the complete media item with providers
    const completeMediaItem = await this.prisma.mediaItem.findUnique({
      where: { id: mediaItem.id },
      include: { streamingProviders: true },
    });

    return { mediaItem: completeMediaItem, isNew: true };
  }

  /**
   * Persists streaming provider information for a media item
   */
  private async persistStreamingProviders(
    mediaItemId: string,
    watchProviders: any,
  ): Promise<void> {
    const providerEntries: CreateStreamingProviderData[] = [];

    // Process watch providers for all regions
    Object.entries(watchProviders.results).forEach(([region, data]: [string, any]) => {
      // Process flatrate (subscription) providers
      if (data.flatrate) {
        data.flatrate.forEach((provider: any) => {
          providerEntries.push({
            mediaItemId,
            provider: provider.provider_name.toLowerCase(),
            regions: [region],
          });
        });
      }

      // Process buy providers
      if (data.buy) {
        data.buy.forEach((provider: any) => {
          providerEntries.push({
            mediaItemId,
            provider: `${provider.provider_name.toLowerCase()}_buy`,
            regions: [region],
          });
        });
      }

      // Process rent providers
      if (data.rent) {
        data.rent.forEach((provider: any) => {
          providerEntries.push({
            mediaItemId,
            provider: `${provider.provider_name.toLowerCase()}_rent`,
            regions: [region],
          });
        });
      }
    });

    // Group by provider and merge regions
    const providerMap = new Map<string, Set<string>>();
    
    providerEntries.forEach(entry => {
      if (!providerMap.has(entry.provider)) {
        providerMap.set(entry.provider, new Set());
      }
      entry.regions.forEach(region => providerMap.get(entry.provider)!.add(region));
    });

    // Create streaming provider records
    const createPromises = Array.from(providerMap.entries()).map(([provider, regions]) =>
      this.prisma.streamingProvider.create({
        data: {
          mediaItemId,
          provider,
          regions: Array.from(regions),
        },
      })
    );

    await Promise.all(createPromises);
  }

  /**
   * Updates streaming provider information for an existing media item
   */
  async updateStreamingProviders(mediaItemId: string): Promise<void> {
    const mediaItem = await this.prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
    });

    if (!mediaItem) {
      throw new Error('Media item not found');
    }

    // Fetch fresh provider data from TMDB
    const mediaDetails = await tmdbService.getMediaDetails(mediaItem.tmdbId, mediaItem.tmdbType as MediaType);

    // Delete existing providers
    await this.prisma.streamingProvider.deleteMany({
      where: { mediaItemId },
    });

    // Add fresh provider data
    if (mediaDetails.watch_providers) {
      await this.persistStreamingProviders(mediaItemId, mediaDetails.watch_providers);
    }
  }

  /**
   * Batch persist multiple media items
   */
  async batchPersistMediaItems(items: { tmdbId: number; mediaType: MediaType }[]): Promise<{
    successful: { tmdbId: number; mediaItem: any; isNew: boolean }[];
    failed: { tmdbId: number; error: string }[];
  }> {
    const results = {
      successful: [] as { tmdbId: number; mediaItem: any; isNew: boolean }[],
      failed: [] as { tmdbId: number; error: string }[],
    };

    // Process items in batches to avoid overwhelming TMDB API
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async ({ tmdbId, mediaType }) => {
          try {
            const result = await this.persistMediaItem(tmdbId, mediaType);
            results.successful.push({ tmdbId, ...result });
          } catch (error) {
            results.failed.push({
              tmdbId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );

      // Small delay between batches to respect rate limits
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Gets media items that need provider updates (older than specified days)
   */
  async getStaleMediaItems(daysOld: number = 7): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.mediaItem.findMany({
      where: {
        updatedAt: {
          lt: cutoffDate,
        },
      },
      include: {
        streamingProviders: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
      take: 50, // Limit to prevent overwhelming updates
    });
  }

  /**
   * Updates stale media items with fresh provider data
   */
  async updateStaleMediaItems(daysOld: number = 7): Promise<{
    updated: number;
    failed: number;
  }> {
    const staleItems = await this.getStaleMediaItems(daysOld);
    
    let updated = 0;
    let failed = 0;

    for (const item of staleItems) {
      try {
        await this.updateStreamingProviders(item.id);
        updated++;
      } catch (error) {
        console.error(`Failed to update providers for media item ${item.id}:`, error);
        failed++;
      }
    }

    return { updated, failed };
  }
}

// Singleton instance
export const mediaPersistenceService = new MediaPersistenceService(new PrismaClient());