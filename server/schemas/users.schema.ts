import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'technician', 'ADMIN', 'TECNICO', 'SUPER_ADMIN']),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').optional(),
  avatar: z.string().url().optional(),
  active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'technician', 'ADMIN', 'TECNICO', 'SUPER_ADMIN']).optional(),
  password: z.string().min(8).optional(),
  avatar: z.string().url().optional(),
  active: z.boolean().optional(),
});
