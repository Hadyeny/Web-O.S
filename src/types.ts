export type Role = 'TECNICO' | 'ADMIN' | 'SUPER_ADMIN' | 'technician' | 'admin';

export type OSStatus = 'Aberta' | 'Em Andamento' | 'Aguardando Peças' | 'Aguardando Cliente' | 'Finalizado' | 'Encerrado';

export type OSPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  active?: boolean;
  ativo?: boolean;
}

export interface Client {
  id: string;
  name: string;
  cnpjOrCpf: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  neighborhood?: string;
  zipCode?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { lat: number; lng: number } | string;
  activeOrdersCount?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required?: boolean;
  notes?: string;
}

export interface ServiceOrderNote {
  id: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: string;
}

export interface OSAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  category?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface ServiceOrder {
  id: string; // e.g. "OS-0095"
  clientId: string;
  clientName: string;
  equipment: string; // e.g. "Servidor", "Notebook HP", "Impressora", "Outro"
  category: string;
  description: string;
  status: OSStatus;
  priority: OSPriority;
  technicianId?: string;
  technicianName?: string;
  stalledHours?: number; // Calculated hours without update
  createdAt: string;
  updatedAt: string;
  notes: ServiceOrderNote[];
  checklist?: ChecklistItem[];
  origin?: string;
  attendanceType?: 'presential' | 'remote' | 'interno' | 'externo' | string;
  technicalSolution?: string;
  valor?: number;
  totalCost?: number;
  laborCost?: number;
  partsCost?: number;
  discountCost?: number;
  paymentMethod?: string;
  scheduledAt?: string;
  closedAt?: string;
  closedBy?: string;
  clientSignature?: string;
  signedBy?: string;
  signedAt?: string;
  signatureHash?: string;
  signatureType?: 'presential' | 'remote';
  clientPasswordEncrypted?: string;
  quoteStatus?: string;
  quoteItems?: any[];
  quoteNotes?: string;
  quoteHistory?: any[];
  attachments?: OSAttachment[];
  rescheduleReason?: string;
  financialNotes?: string;
  isExternal?: boolean;
  serviceType?: 'interno' | 'externo';
}

export interface AppTemplate {
  id: string;
  name?: string;
  title?: string;
  description: string;
  category: string;
  badge?: string;
  suggestedPrompt?: string;
  checklist?: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string; // e.g., "CRIAR_OS", "ATUALIZAR_STATUS", "REATRIBUIR_TECNICO"
  targetId: string;
  details: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // 'all' or specific user ID
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  osId?: string;
  read: boolean;
  createdAt: string;
}

export interface TechProductivity {
  technicianId: string;
  technicianName: string;
  totalAssigned: number;
  inProgressCount: number;
  completedCount: number;
  avgResolutionHours: number;
}

export interface DashboardStats {
  totalOS: number;
  abertas: number;
  emAndamento: number;
  aguardandoCliente: number;
  finalizadas: number;
  atendExterno?: number;
  stalledOrders: ServiceOrder[];
  productivity: TechProductivity[];
}
