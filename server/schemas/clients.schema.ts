import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nome do cliente deve ter ao menos 2 caracteres'),
  cnpjOrCpf: z.string().default(''),
  email: z.string().email('E-mail inválido').or(z.literal('')).default(''),
  phone: z.string().default(''),
  city: z.string().default(''),
  address: z.string().optional().default(''),
  neighborhood: z.string().optional().default(''),
  zipCode: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  cnpjOrCpf: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});
