import { Request } from 'express';

// Definieren des Basis-Benutzerobjekts, das im Request nach der Authentifizierung
// durch die 'authMiddleware' erwartet wird.
interface AuthUser {
  id: string;
  email: string;
  // Fügen Sie hier alle weiteren Benutzerfelder hinzu, die Sie benötigen, z. B. role
}

// Erweitern Sie den Express Request, um die 'user'-Eigenschaft hinzuzufügen.
// Dies behebt den Fehler TS2769 ("Property 'user' is missing...")
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}