import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, WatchStatus, Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const parseOptionalDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const createWatchlistEntrySchema = z.object({
  tmdbId: z.number().int().positive('TMDB ID must be a positive integer'),
  tmdbType: z.enum(['movie', 'tv'], {
    errorMap: () => ({ message: 'Type must be either "movie" or "tv"' }),
  }),
  status: z.nativeEnum(WatchStatus).optional().default('not_watched'),
  rating: z.number().int().min(0).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z
    .object({
      title: z.string(),
      description: z.string().optional().nullable(),
      posterPath: z.string().optional().nullable(),
      backdropPath: z.string().optional().nullable(),
      releaseDate: z.string().optional().nullable(),
      rating: z.number().optional().nullable(),
      genres: z.array(z.string()).optional().default([]),
      creators: z.array(z.string()).optional().default([]),
      streamingProviders: z
        .array(
          z.object({
            provider: z.string(),
            url: z.string().optional().nullable(),
            regions: z.array(z.string()).optional().default([]),
          }),
        )
        .optional(),
    })
    .optional(),
});

const updateWatchlistEntrySchema = z
  .object({
    status: z.nativeEnum(WatchStatus).optional(),
    rating: z.number().int().min(0).max(5).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => data.status !== undefined || data.rating !== undefined || data.notes !== undefined,
    { message: 'At least one field must be provided to update the watchlist entry.' },
  );

const progressUpdateSchema = z.object({
  status: z.nativeEnum(WatchStatus),
  rating: z.number().int().min(0).max(5).optional().nullable(),
});

const findEntryForUser = async (
  entryId: string,
  userId: string,
  res: Response,
  forbiddenMessage: string,
) => {
  const entry = await prisma.watchlistEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    res.status(404).json({ error: 'Watchlist entry not found' });
    return null;
  }

  if (entry.userId !== userId) {
    res.status(403).json({ error: forbiddenMessage });
    return null;
  }

  return entry;
};

// GET /watchlist - Get user's watchlist
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { status, sortBy = 'dateAdded', order = 'desc' } = req.query;

      const where: Prisma.WatchlistEntryWhereInput = { userId };
      if (status && typeof status === 'string') {
        if (!Object.values(WatchStatus).includes(status as WatchStatus)) {
          res.status(400).json({ error: 'Invalid status filter' });
          return;
        }
        where.status = status as WatchStatus;
      }

      const allowedSortFields: Array<keyof Prisma.WatchlistEntryOrderByWithRelationInput> = [
        'dateAdded',
        'dateUpdated',
        'status',
        'rating',
      ];
      const sortField =
        typeof sortBy === 'string' &&
        allowedSortFields.includes(sortBy as keyof Prisma.WatchlistEntryOrderByWithRelationInput)
          ? (sortBy as keyof Prisma.WatchlistEntryOrderByWithRelationInput)
          : 'dateAdded';
      const sortOrder: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
      const orderBy = { [sortField]: sortOrder } as Prisma.WatchlistEntryOrderByWithRelationInput;

      const watchlistEntries = await prisma.watchlistEntry.findMany({
        where,
        include: {
          mediaItem: {
            include: {
              streamingProviders: true,
            },
          },
        },
        orderBy,
      });

      res.json({
        data: watchlistEntries,
        count: watchlistEntries.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /watchlist/stats - Get aggregated status counts
router.get(
  '/stats',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const stats = await prisma.watchlistEntry.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true,
        },
      });

      const formattedStats = {
        total: 0,
        not_watched: 0,
        watching: 0,
        completed: 0,
      } as Record<string, number> & { total: number };

      stats.forEach((stat) => {
        formattedStats[stat.status] = stat._count.status;
        formattedStats.total += stat._count.status;
      });

      res.json(formattedStats);
    } catch (error) {
      next(error);
    }
  },
);

// POST /watchlist - Add to watchlist
router.post(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = createWatchlistEntrySchema.parse(req.body);
      const { tmdbId, tmdbType, status, rating, notes, metadata } = validatedData;

      let mediaItem = await prisma.mediaItem.findUnique({
        where: { tmdbId },
      });

      if (!mediaItem) {
        if (!metadata || !metadata.title) {
          res.status(400).json({
            error: 'Media item not found. Please provide metadata to create it.',
          });
          return;
        }

        mediaItem = await prisma.mediaItem.create({
          data: {
            tmdbId,
            tmdbType,
            title: metadata.title,
            description: metadata.description || null,
            posterPath: metadata.posterPath || null,
            backdropPath: metadata.backdropPath || null,
            releaseDate: parseOptionalDate(metadata.releaseDate),
            rating: metadata.rating ?? null,
            genres: metadata.genres || [],
            creators: metadata.creators || [],
          },
        });
      }

      const existingEntry = await prisma.watchlistEntry.findUnique({
        where: {
          userId_mediaItemId: {
            userId,
            mediaItemId: mediaItem.id,
          },
        },
      });

      if (existingEntry) {
        res.status(409).json({
          error: 'This media item is already in your watchlist',
          entryId: existingEntry.id,
        });
        return;
      }

      if (metadata?.streamingProviders?.length) {
        await Promise.all(
          metadata.streamingProviders.map((provider) =>
            prisma.streamingProvider.upsert({
              where: {
                mediaItemId_provider: {
                  mediaItemId: mediaItem!.id,
                  provider: provider.provider,
                },
              },
              update: {
                url: provider.url ?? null,
                regions: provider.regions ?? [],
              },
              create: {
                mediaItemId: mediaItem!.id,
                provider: provider.provider,
                url: provider.url ?? null,
                regions: provider.regions ?? [],
              },
            }),
          ),
        );
      }

      const watchlistEntry = await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: mediaItem.id,
          status: status || 'not_watched',
          rating,
          notes,
        },
        include: {
          mediaItem: {
            include: {
              streamingProviders: true,
            },
          },
        },
      });

      res.status(201).json({
        message: 'Added to watchlist successfully',
        data: watchlistEntry,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  },
);

// PATCH /watchlist/:id - Update watchlist entry
router.patch(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;
      const validatedData = updateWatchlistEntrySchema.parse(req.body);

      const entry = await findEntryForUser(
        entryId,
        userId,
        res,
        'You do not have permission to update this entry',
      );
      if (!entry) {
        return;
      }

      const dataToUpdate: Prisma.WatchlistEntryUpdateInput = {};
      if (validatedData.status !== undefined) {
        dataToUpdate.status = validatedData.status;
      }
      if (validatedData.rating !== undefined) {
        dataToUpdate.rating = validatedData.rating;
      }
      if (validatedData.notes !== undefined) {
        dataToUpdate.notes = validatedData.notes;
      }

      const updatedEntry = await prisma.watchlistEntry.update({
        where: { id: entryId },
        data: dataToUpdate,
        include: {
          mediaItem: {
            include: {
              streamingProviders: true,
            },
          },
        },
      });

      res.json({
        message: 'Watchlist entry updated successfully',
        data: updatedEntry,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  },
);

// PATCH /watchlist/:id/progress - Update watch progress
router.patch(
  '/:id/progress',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;
      const validatedData = progressUpdateSchema.parse(req.body);

      const entry = await findEntryForUser(
        entryId,
        userId,
        res,
        'You do not have permission to update this entry',
      );
      if (!entry) {
        return;
      }

      const dataToUpdate: Prisma.WatchlistEntryUpdateInput = {
        status: validatedData.status,
      };

      if (validatedData.rating !== undefined) {
        dataToUpdate.rating = validatedData.rating;
      }

      const updatedEntry = await prisma.watchlistEntry.update({
        where: { id: entryId },
        data: dataToUpdate,
        include: {
          mediaItem: {
            include: {
              streamingProviders: true,
            },
          },
        },
      });

      res.json({
        message: 'Watch progress updated successfully',
        data: updatedEntry,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  },
);

// DELETE /watchlist/:id - Remove from watchlist
router.delete(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const entryId = req.params.id;

      const entry = await findEntryForUser(
        entryId,
        userId,
        res,
        'You do not have permission to delete this entry',
      );
      if (!entry) {
        return;
      }

      await prisma.watchlistEntry.delete({
        where: { id: entryId },
      });

      res.json({
        message: 'Watchlist entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

export { router as watchlistRouter };
