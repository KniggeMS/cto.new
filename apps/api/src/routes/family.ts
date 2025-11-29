import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, Prisma, WatchStatus } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router: Router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createFamilySchema = z.object({
  name: z
    .string()
    .min(1, 'Family name is required')
    .max(100, 'Family name must be 100 characters or less'),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member'], {
    errorMap: () => ({ message: 'Role must be one of: owner, admin, member' }),
  }),
});

// Helper functions
const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const getInviteExpiryDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 7); // 7 days from now
  return date;
};

const checkFamilyMembership = async (
  userId: string,
  familyId: string,
  res: Response,
  minRole?: 'owner' | 'admin' | 'member',
): Promise<boolean> => {
  const membership = await prisma.familyMembership.findUnique({
    where: {
      userId_familyId: {
        userId,
        familyId,
      },
    },
  });

  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this family' });
    return false;
  }

  if (minRole) {
    const roleHierarchy: Record<string, number> = {
      owner: 3,
      admin: 2,
      member: 1,
    };

    if ((roleHierarchy[membership.role] || 0) < roleHierarchy[minRole]) {
      res.status(403).json({ error: `You must be at least an ${minRole} to perform this action` });
      return false;
    }
  }

  return true;
};

// POST /families - Create a new family
router.post(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = createFamilySchema.parse(req.body);
      const { name } = validatedData;

      // Create family
      const family = await prisma.family.create({
        data: {
          name,
          createdBy: userId,
          members: {
            create: {
              userId,
              role: 'owner',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        message: 'Family created successfully',
        data: family,
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

// POST /families/:id/invite - Invite a member to family
router.post(
  '/:id/invite',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;
      const validatedData = inviteMemberSchema.parse(req.body);
      const { email } = validatedData;

      // Check if family exists
      const family = await prisma.family.findUnique({
        where: { id: familyId },
      });

      if (!family) {
        res.status(404).json({ error: 'Family not found' });
        return;
      }

      // Check if user is a member with admin or owner role
      const hasPermission = await checkFamilyMembership(userId, familyId, res, 'admin');
      if (!hasPermission) {
        return;
      }

      // Check if invitee is already a member
      const inviteeUser = await prisma.user.findUnique({
        where: { email },
      });

      if (inviteeUser) {
        const existingMembership = await prisma.familyMembership.findUnique({
          where: {
            userId_familyId: {
              userId: inviteeUser.id,
              familyId,
            },
          },
        });

        if (existingMembership) {
          res.status(409).json({ error: 'User is already a member of this family' });
          return;
        }
      }

      // Generate invitation token
      const token = generateInviteToken();
      const expiresAt = getInviteExpiryDate();

      // Create or update invitation
      const invitation = await prisma.familyInvitation.upsert({
        where: {
          familyId_email: {
            familyId,
            email,
          },
        },
        update: {
          token,
          status: 'pending',
          expiresAt,
        },
        create: {
          familyId,
          email,
          token,
          status: 'pending',
          expiresAt,
        },
      });

      res.status(201).json({
        message: 'Invitation sent successfully',
        data: {
          id: invitation.id,
          familyId: invitation.familyId,
          email: invitation.email,
          token: invitation.token,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
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

// POST /families/:id/invitations/:token/accept - Accept an invitation
router.post(
  '/:id/invitations/:token/accept',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;
      const token = req.params.token;

      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Find and validate invitation
      const invitation = await prisma.familyInvitation.findFirst({
        where: {
          token,
          familyId,
          email: user.email,
          status: 'pending',
        },
      });

      if (!invitation) {
        res.status(404).json({ error: 'Invitation not found or already processed' });
        return;
      }

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        res.status(410).json({ error: 'Invitation has expired' });
        return;
      }

      // Check if user is already a member
      const existingMembership = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId,
            familyId,
          },
        },
      });

      if (existingMembership) {
        res.status(409).json({ error: 'You are already a member of this family' });
        return;
      }

      // Add user to family and mark invitation as accepted
      const result = await prisma.$transaction(async (tx) => {
        const membership = await tx.familyMembership.create({
          data: {
            userId,
            familyId,
            role: 'member',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        await tx.familyInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
          },
        });

        return membership;
      });

      res.status(200).json({
        message: 'Invitation accepted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /families/:id - Get family details
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;

      const family = await prisma.family.findUnique({
        where: { id: familyId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!family) {
        res.status(404).json({ error: 'Family not found' });
        return;
      }

      // Check membership
      const hasPermission = await checkFamilyMembership(userId, familyId, res);
      if (!hasPermission) {
        return;
      }

      res.json({
        data: family,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /families/:id/members - List family members
router.get(
  '/:id/members',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;

      // Check membership
      const hasPermission = await checkFamilyMembership(userId, familyId, res);
      if (!hasPermission) {
        return;
      }

      const members = await prisma.familyMembership.findMany({
        where: { familyId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      res.json({
        data: members,
        count: members.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /families/:id/watchlists - Get aggregated watchlist for all family members
router.get(
  '/:id/watchlists',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;
      const { status, sortBy = 'dateAdded', order = 'desc' } = req.query;

      // Check membership
      const hasPermission = await checkFamilyMembership(userId, familyId, res);
      if (!hasPermission) {
        return;
      }

      // Build where clause
      const where: Prisma.WatchlistEntryWhereInput = {
        user: {
          familyMemberships: {
            some: {
              familyId,
            },
          },
        },
      };

      // Add status filter if provided
      if (status && typeof status === 'string') {
        if (!Object.values(WatchStatus).includes(status as WatchStatus)) {
          res.status(400).json({ error: 'Invalid status filter' });
          return;
        }
        where.status = status as WatchStatus;
      }

      // Validate and set sorting
      const allowedSortFields = ['dateAdded', 'dateUpdated', 'status', 'rating'];
      const sortField =
        typeof sortBy === 'string' && allowedSortFields.includes(sortBy) ? sortBy : 'dateAdded';
      const sortOrder = order === 'asc' ? 'asc' : 'desc';
      const orderBy = { [sortField]: sortOrder };

      const watchlistEntries = await prisma.watchlistEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
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
        familyId,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /families/:id/members/:memberId - Update member role
router.patch(
  '/:id/members/:memberId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;
      const memberId = req.params.memberId;
      const validatedData = updateMemberRoleSchema.parse(req.body);
      const { role } = validatedData;

      // Check if user is owner
      const hasPermission = await checkFamilyMembership(userId, familyId, res, 'owner');
      if (!hasPermission) {
        return;
      }

      // Check if member exists in family
      const member = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId: memberId,
            familyId,
          },
        },
      });

      if (!member) {
        res.status(404).json({ error: 'Member not found in this family' });
        return;
      }

      // Prevent changing owner role from owner
      if (member.role === 'owner' && role !== 'owner') {
        res.status(400).json({ error: 'Cannot change the owner role' });
        return;
      }

      // Update member role
      const updatedMember = await prisma.familyMembership.update({
        where: {
          userId_familyId: {
            userId: memberId,
            familyId,
          },
        },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      res.json({
        message: 'Member role updated successfully',
        data: updatedMember,
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

// GET /families/:id/invitations - List family invitations
router.get(
  '/:id/invitations',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;

      // Check membership (admin or owner required)
      const hasPermission = await checkFamilyMembership(userId, familyId, res, 'admin');
      if (!hasPermission) {
        return;
      }

      const invitations = await prisma.familyInvitation.findMany({
        where: { familyId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        data: invitations,
        count: invitations.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /families/:id/invitations/:invitationId/resend - Resend an invitation
router.post(
  '/:id/invitations/:invitationId/resend',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;
      const invitationId = req.params.invitationId;

      // Check membership (admin or owner required)
      const hasPermission = await checkFamilyMembership(userId, familyId, res, 'admin');
      if (!hasPermission) {
        return;
      }

      // Find the invitation
      const invitation = await prisma.familyInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        res.status(404).json({ error: 'Invitation not found' });
        return;
      }

      if (invitation.familyId !== familyId) {
        res.status(404).json({ error: 'Invitation not found for this family' });
        return;
      }

      // Generate new token and expiry
      const token = generateInviteToken();
      const expiresAt = getInviteExpiryDate();

      // Update the invitation
      const updatedInvitation = await prisma.familyInvitation.update({
        where: { id: invitationId },
        data: {
          token,
          status: 'pending',
          expiresAt,
        },
      });

      res.json({
        message: 'Invitation resent successfully',
        data: updatedInvitation,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /families/:id/members/:memberId - Remove a member from family
router.delete(
  '/:id/members/:memberId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;
      const memberId = req.params.memberId;

      // Check membership (admin or owner required)
      const hasPermission = await checkFamilyMembership(userId, familyId, res, 'admin');
      if (!hasPermission) {
        return;
      }

      // Find member to remove
      const memberToRemove = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId: memberId,
            familyId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!memberToRemove) {
        res.status(404).json({ error: 'Member not found in this family' });
        return;
      }

      // Prevent removing owner (except by themselves)
      if (memberToRemove.role === 'owner' && memberToRemove.userId !== userId) {
        res.status(400).json({ error: 'Cannot remove the family owner' });
        return;
      }

      // Remove the member
      await prisma.familyMembership.delete({
        where: {
          userId_familyId: {
            userId: memberId,
            familyId,
          },
        },
      });

      res.json({
        message: 'Member removed successfully',
        data: memberToRemove,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /families/:id/leave - Leave a family
router.post(
  '/:id/leave',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const familyId = req.params.id;

      // Check membership
      const membership = await prisma.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId,
            familyId,
          },
        },
      });

      if (!membership) {
        res.status(404).json({ error: 'You are not a member of this family' });
        return;
      }

      // Prevent owner from leaving (they must transfer ownership first)
      if (membership.role === 'owner') {
        res
          .status(400)
          .json({ error: 'Family owner cannot leave. Please transfer ownership first.' });
        return;
      }

      // Remove the membership
      await prisma.familyMembership.delete({
        where: {
          userId_familyId: {
            userId,
            familyId,
          },
        },
      });

      res.json({
        message: 'Left family successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /families - List user's families
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const families = await prisma.family.findMany({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        data: families,
        count: families.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

export { router as familyRouter };
