import bcrypt from 'bcryptjs';
import { User, Role } from '../../../src/types.js';

export interface ServerUser extends User {
  passwordHash?: string;
  mustChangePassword?: boolean;
  tokenVersion?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

// Default initial password hashes with bcrypt cost 12
// In production or bootstrap, admin password can be overridden via ADMIN_PASSWORD or bootstrap.ts
export const defaultUsersFixture: ServerUser[] = [
  {
    id: 'u-1',
    name: 'Rogerio (Admin)',
    email: 'rogerio@plioou.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    // Default initial hash for AnnieFakine2403, or overridden on startup
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'AnnieFakine2403', 12),
    mustChangePassword: false,
    tokenVersion: 1,
    createdAt: '2026-01-01T08:00:00Z',
    active: true,
  },
  {
    id: 'u-2',
    name: 'Leonardo (Técnico)',
    email: 'leonardo@plioou.com',
    role: 'technician',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    passwordHash: bcrypt.hashSync(process.env.TECH_PASSWORD || 'tecnico123', 12),
    mustChangePassword: false,
    tokenVersion: 1,
    createdAt: '2026-01-01T08:00:00Z',
    active: true,
  },
  {
    id: 'u-3',
    name: 'Pedro (Técnico)',
    email: 'pedro@plioou.com',
    role: 'technician',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    passwordHash: bcrypt.hashSync(process.env.TECH_PASSWORD || 'tecnico123', 12),
    mustChangePassword: false,
    tokenVersion: 1,
    createdAt: '2026-01-01T08:00:00Z',
    active: true,
  },
  {
    id: 'u-4',
    name: 'Everson (Técnico)',
    email: 'everson@plioou.com',
    role: 'technician',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    passwordHash: bcrypt.hashSync(process.env.TECH_PASSWORD || 'tecnico123', 12),
    mustChangePassword: false,
    tokenVersion: 1,
    createdAt: '2026-01-01T08:00:00Z',
    active: true,
  },
];
