import { UserRole } from '@prisma/client';

export interface JwtUser {
  id: number;
  email: string;
  role: UserRole;
}

// Extend Express User type
import 'passport';

declare global {
  namespace Express {
    // Augment the existing User interface from passport types
    interface User extends JwtUser {}
  }
}
