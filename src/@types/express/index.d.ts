import 'express';
import { Role } from '../../types.js';

export type UserRole = Role;

export interface AuthenticatedUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  avatar?: string;
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
