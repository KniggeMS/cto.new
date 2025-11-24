import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, WatchStatus, Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import { watchlistImportService } from '../services/watchlistImportService';
import {
  bulkImportRequestSchema,
  exportResponseSchema,
} from '@infocus/shared';

const router: Router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
    const allowedExtensions = ['.csv', '.json'];
    
    if (allowedTypes.includes(file.mimetype) || 
        allowedExtensions.some(ext => file.originalname?.toLowerCase().endsWith(ext))) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  },
});

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

      const allowedSortFields = ['dateAdded', 'dateUpdated', 'status', 'rating'];
      const sortField =
        typeof sortBy === 'string' && allowedSortFields.includes(sortBy)
          ? sortBy
          : 'dateAdded';
      const sortOrder = order === 'asc' ? 'asc' : 'desc';
      const orderBy = { [sortField]: sortOrder };

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

      stats.forEach((stat: any) => {
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
        if (!metadata || !(metadata as any).title) {
          res.status(400).json({
            error: 'Media item not found. Please provide metadata to create it.',
          });
          return;
        }

        mediaItem = await prisma.mediaItem.create({
          data: {
            tmdbId,
            tmdbType,
            title: (metadata as any).title,
            description: (metadata as any).description || null,
            posterPath: (metadata as any).posterPath || null,
            backdropPath: (metadata as any).backdropPath || null,
            releaseDate: parseOptionalDate((metadata as any).releaseDate),
            rating: (metadata as any).rating ?? null,
            genres: (metadata as any).genres || [],
            creators: (metadata as any).creators || [],
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

      if ((metadata as any)?.streamingProviders?.length) {
        await Promise.all(
          (metadata as any).streamingProviders.map((provider: any) =>
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

      const dataToUpdate: any = {};
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

      const dataToUpdate: any = {
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

// POST /watchlist/import/preview - Preview import data
router.post(
  '/import/preview',
  authMiddleware,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Parse the uploaded file
      const rawRows = await watchlistImportService.parseUploadedFile(req.file);
      
      // Generate preview with TMDB matches
      const previewItems = await watchlistImportService.generatePreview(rawRows, userId);

      res.json({
        message: 'Import preview generated successfully',
        data: previewItems,
        count: previewItems.length,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('file format')) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  },
);

// POST /watchlist/import/confirm - Confirm and execute import
router.post(
  '/import/confirm',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = bulkImportRequestSchema.parse(req.body);

      // Execute the import
      const result = await watchlistImportService.confirmImport(validatedData, userId);

      res.json({
        message: 'Import completed successfully',
        data: result,
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

// GET /watchlist/export - Export watchlist data
router.get(
  '/export',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const format = req.query.format as string || 'json';

      if (!['json', 'csv'].includes(format)) {
        res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
        return;
      }

      // Get export data
      const exportData = await watchlistImportService.exportWatchlist(userId);

      // Validate export data
      const validatedData = exportResponseSchema.parse(exportData);

      if (format === 'csv') {
        // Return CSV
        const csv = watchlistImportService.exportToCsv(validatedData);
        const filename = `watchlist-export-${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        // Return JSON
        const filename = `watchlist-export-${new Date().toISOString().split('T')[0]}.json`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(validatedData);
      }
    } catch (error) {
      next(error);
    }
  },
);

export { router as watchlistRouter };
