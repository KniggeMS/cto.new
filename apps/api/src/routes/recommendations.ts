import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { generateRecommendations, clearCache } from '../services/recommendationService';

const router: Router = Router();
const prisma = new PrismaClient();

// GET /recommendations - Get personalized recommendations
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { familyId, limit, refresh } = req.query;

      // Validate familyId if provided
      if (familyId && typeof familyId !== 'string') {
        res.status(400).json({ error: 'Invalid familyId parameter' });
        return;
      }

      // Validate limit if provided
      let limitNum: number | undefined;
      if (limit) {
        limitNum = parseInt(limit as string, 10);
        if (isNaN(limitNum) || limitNum <= 0) {
          res.status(400).json({ error: 'Invalid limit parameter' });
          return;
        }
      }

      // Check if family exists and user is a member
      if (familyId) {
        const membership = await prisma.familyMembership.findUnique({
          where: {
            userId_familyId: {
              userId,
              familyId: familyId as string,
            },
          },
        });

        if (!membership) {
          res.status(403).json({ error: 'You are not a member of this family' });
          return;
        }
      }

      // Force cache refresh if requested
      const useCache = refresh !== 'true';

      // Generate recommendations
      let recommendations = await generateRecommendations(
        userId,
        familyId as string | undefined,
        useCache,
      );

      // Apply limit if specified
      if (limitNum) {
        recommendations = recommendations.slice(0, limitNum);
      }

      res.json({
        data: recommendations,
        count: recommendations.length,
        userId,
        ...(familyId && { familyId }),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /recommendations/clear-cache - Clear recommendation cache
router.post(
  '/clear-cache',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { familyId } = req.body;

      if (familyId && typeof familyId !== 'string') {
        res.status(400).json({ error: 'Invalid familyId parameter' });
        return;
      }

      // Build cache key
      const cacheKey = familyId ? `${userId}:${familyId}` : userId;
      clearCache(cacheKey);

      res.json({
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
