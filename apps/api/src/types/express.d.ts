import { Request } from 'express';

// Define the base user object expected in the request after authentication
// by the 'authMiddleware'.
interface AuthUser {
  id: string;
  email: string;
  // Add any other user fields you need here, e.g. role
}

// Extend the Express Request to add the 'user' property.
// This fixes the error TS2769 ("Property 'user' is missing...")
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}