import { User } from '@prisma/client';

/**
 * Sanitize user object to return only safe fields
 */
export const sanitizeUser = (user: User) => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
};
