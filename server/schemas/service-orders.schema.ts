import { z } from 'zod';

export const createServiceOrderSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  equipment: z.string().min(1, 'Equipamento é obrigatório'),
  category: z.string().default('Geral'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  status: z.enum(['Aberta', 'Em Andamento', 'Aguardando Peças', 'Aguardando Cliente', 'Finalizado', 'Encerrado']).default('Aberta'),
  priority: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']).default('Média'),
  technicianId: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  origin: z.string().optional(),
  attendanceType: z.string().optional(),
  checklist: z.array(z.any()).optional(),
  valor: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional(),
  clientPassword: z.string().optional(),
});

export const updateServiceOrderSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  equipment: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['Aberta', 'Em Andamento', 'Aguardando Peças', 'Aguardando Cliente', 'Finalizado', 'Encerrado']).optional(),
  priority: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']).optional(),
  technicianId: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  technicalSolution: z.string().optional().nullable(),
  origin: z.string().optional(),
  attendanceType: z.string().optional(),
  checklist: z.array(z.any()).optional(),
  valor: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  laborCost: z.number().nonnegative().optional(),
  partsCost: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional(),
  clientPassword: z.string().optional(),
  clientPasswordEncrypted: z.string().optional(),
  isExternal: z.boolean().optional(),
  serviceType: z.enum(['interno', 'externo']).optional(),
  closedAt: z.string().optional().nullable(),
  closedBy: z.string().optional().nullable(),
});

export const addNoteSchema = z.object({
  content: z.string().min(1, 'O conteúdo da nota não pode estar vazio'),
});

export const submitSignatureSchema = z.object({
  signatureDataUrl: z.string().min(1, 'Assinatura em formato imagem é obrigatória'),
  signerName: z.string().min(1, 'Nome do signatário é obrigatório'),
  document: z.string().optional(),
  phone: z.string().optional(),
});
