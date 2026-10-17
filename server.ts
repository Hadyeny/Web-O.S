import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import {
  usersStore,
  clientsStore,
  serviceOrdersStore,
  auditLogsStore,
  notificationsStore,
  checklistsStore,
  getDashboardStats,
  initializeDatabase,
} from './server/store.js';
import { User, Role, ServiceOrder, AuditLog, Notification, ServiceOrderNote, Client, DashboardStats, TechProductivity } from './src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'plioou_ti_jwt_secret_key_2026';

function getPort(): number {
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    const p = parseInt(process.argv[portIdx + 1], 10);
    if (!isNaN(p)) return p;
  }
  if (process.env.PORT) {
    const p = parseInt(process.env.PORT, 10);
    if (!isNaN(p)) return p;
  }
  return 3000;
}

function getHost(): string {
  const hostIdx = process.argv.indexOf('--host');
  if (hostIdx !== -1 && process.argv[hostIdx + 1]) {
    return process.argv[hostIdx + 1];
  }
  return process.env.HOST || '0.0.0.0';
}

const PORT = getPort();
const HOST = getHost();

const getDirname = () => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
};
const appDir = getDirname();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    name: string;
  };
}

async function startServer() {
  await initializeDatabase();

  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  app.use(express.json());

  // Socket.io connections & rooms
  io.on('connection', (socket) => {
    console.log('Client connected to real-time socket:', socket.id);

    socket.on('join_user', (userId: string) => {
      socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from real-time socket:', socket.id);
    });
  });

  // Helper to emit real-time updates and create notifications
  function notifyAll(title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert', osId?: string) {
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: 'all',
      title,
      message,
      type,
      osId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notificationsStore.unshift(notif);
    io.emit('notification', notif);
    io.emit('os_updated');
  }

  // Authentication Middleware
  function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token === 'demo_token') {
      // Fallback for development preview convenience
      const devUserId = (req.headers['x-dev-user-id'] as string) || 'u-1';
      const found = usersStore.find((u) => u.id === devUserId) || usersStore[0];
      if (found) {
        req.user = { id: found.id, email: found.email, role: found.role, name: found.name };
        return next();
      }
      return res.status(401).json({ error: 'Acesso não autorizado. Token ausente.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role; name: string };
      req.user = decoded;
      next();
    } catch {
      // Fallback if token is expired or invalid in dev environment
      const devUserId = (req.headers['x-dev-user-id'] as string) || 'u-1';
      const found = usersStore.find((u) => u.id === devUserId) || usersStore[0];
      if (found) {
        req.user = { id: found.id, email: found.email, role: found.role, name: found.name };
        return next();
      }
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
  }

  // Auth Routes
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const cleanInput = (email || '').trim().toLowerCase();

    const user = usersStore.find((u) => {
      const uEmail = u.email.toLowerCase();
      const uName = u.name.toLowerCase();
      const uRole = u.role.toLowerCase();
      return (
        uEmail === cleanInput ||
        uEmail.startsWith(cleanInput) ||
        uName.includes(cleanInput) ||
        (cleanInput === 'admin' && uRole === 'admin') ||
        (cleanInput === 'tecnico' && uRole === 'technician') ||
        (cleanInput === 'seu.usuario' && uRole === 'technician')
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário ou e-mail não encontrado.' });
    }

    // Flexible password check for demo/testing
    if (password && password.length < 2) {
      return res.status(401).json({ error: 'Por favor, informe uma senha válida.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user,
    });
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
    const user = usersStore.find((u) => u.id === req.user?.id);
    if (!user) {
      return res.status(444).json({ error: 'Usuário não encontrado.' });
    }
    res.json(user);
  });

  // Users endpoints
  app.get('/api/users', authenticateToken, (req: Request, res: Response) => {
    res.json(usersStore);
  });

  app.post('/api/users', authenticateToken, (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem cadastrar novos usuários.' });
    }
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }
    const existing = usersStore.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      role: role === 'admin' ? 'admin' : 'technician',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    };
    usersStore.push(newUser);

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Administrador',
      userRole: req.user?.role || 'admin',
      action: 'USUARIO_CRIADO',
      targetId: newUser.id,
      details: `Novo usuário criado: ${name} (${role}) - E-mail: ${email}`,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.unshift(audit);

    res.json(newUser);
  });

  // Service Orders Endpoints
  app.get('/api/service-orders', authenticateToken, (req: AuthRequest, res: Response) => {
    const { techId, status, search, stalledOnly, scope } = req.query;
    let orders = [...serviceOrdersStore];

    // Filter by technician if Technician role or techId requested
    const targetTechId = (techId as string) || (req.user?.role === 'technician' ? req.user.id : undefined);

    if (targetTechId && targetTechId !== 'all') {
      if (scope === 'mine_only') {
        orders = orders.filter((os) => os.technicianId === targetTechId);
      } else {
        // Technicians see:
        // 1. Service orders assigned to them
        // 2. ALL newly opened orders (status === 'Aberta')
        // 3. ALL unassigned orders (!os.technicianId)
        orders = orders.filter(
          (os) =>
            os.technicianId === targetTechId ||
            os.status === 'Aberta' ||
            !os.technicianId ||
            os.technicianId === ''
        );
      }
    }

    if (status) {
      orders = orders.filter((os) => os.status === status);
    }

    if (stalledOnly === 'true') {
      orders = orders.filter((os) => (os.stalledHours || 0) >= 48 && os.status !== 'Finalizado' && os.status !== 'Encerrado');
    }

    if (search) {
      const q = (search as string).toLowerCase();
      orders = orders.filter(
        (os) =>
          os.id.toLowerCase().includes(q) ||
          os.clientName.toLowerCase().includes(q) ||
          os.equipment.toLowerCase().includes(q) ||
          (os.technicianName && os.technicianName.toLowerCase().includes(q))
      );
    }

    // Sort by id descending
    orders.sort((a, b) => b.id.localeCompare(a.id));

    res.json(orders);
  });

  app.post('/api/service-orders', authenticateToken, (req: AuthRequest, res: Response) => {
    const { clientId, clientName, equipment, category, description, priority, origin, attendanceType, technicianId } = req.body;

    if (!clientName || !equipment || !description) {
      return res.status(400).json({ error: 'Campos obrigatórios: Cliente, Equipamento e Descrição.' });
    }

    // If no technicianId specified, default to creating user if user is a technician
    const effectiveTechId = technicianId || (req.user?.role === 'technician' ? req.user.id : undefined);
    const tech = usersStore.find((u) => u.id === effectiveTechId);

    // Generate OS code starting from OS-0001
    const lastNum = serviceOrdersStore.reduce((max, os) => {
      const match = os.id.match(/OS-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const nextId = `OS-${(lastNum + 1).toString().padStart(4, '0')}`;

    const newOS: ServiceOrder = {
      id: nextId,
      clientId: clientId || `c-${Date.now()}`,
      clientName,
      equipment,
      category: category || 'Geral',
      description,
      origin: origin || 'Interna',
      attendanceType: attendanceType || (origin === 'Externa' ? 'presential' : 'remote'),
      status: 'Aberta',
      priority: priority || 'Média',
      technicianId: tech ? tech.id : undefined,
      technicianName: tech ? tech.name : undefined,
      stalledHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
    };

    serviceOrdersStore.unshift(newOS);

    // Add Audit Log
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'sys',
      userName: req.user?.name || 'Sistema',
      userRole: req.user?.role || 'admin',
      action: 'CRIAR_OS',
      targetId: newOS.id,
      details: `Criou nova OS para o cliente ${clientName} (${equipment})`,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.unshift(audit);

    notifyAll(
      `Nova Chamado ${newOS.id}`,
      `O.S. ${newOS.id} criada para ${clientName}${tech ? ` - Atribuída a ${tech.name}` : ''}`,
      'info',
      newOS.id
    );

    res.status(201).json(newOS);
  });

  app.put('/api/service-orders/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
      status,
      priority,
      technicianId,
      description,
      laborCost,
      partsCost,
      discountCost,
      totalCost,
      paymentMethod,
      financialNotes,
      technicalSolution,
      quoteItems,
      quoteStatus,
      quoteNotes,
    } = req.body;

    const os = serviceOrdersStore.find((item) => item.id === id);
    if (!os) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    const oldStatus = os.status;
    const oldTechName = os.technicianName;

    if (status) os.status = status;
    if (priority) os.priority = priority;
    if (description) os.description = description;

    if (laborCost !== undefined) os.laborCost = Number(laborCost);
    if (partsCost !== undefined) os.partsCost = Number(partsCost);
    if (discountCost !== undefined) os.discountCost = Number(discountCost);
    if (totalCost !== undefined) os.totalCost = Number(totalCost);
    if (paymentMethod !== undefined) os.paymentMethod = paymentMethod;
    if (financialNotes !== undefined) os.financialNotes = financialNotes;
    if (technicalSolution !== undefined) os.technicalSolution = technicalSolution;
    if (quoteItems !== undefined) os.quoteItems = quoteItems;
    if (quoteStatus !== undefined) os.quoteStatus = quoteStatus;
    if (quoteNotes !== undefined) os.quoteNotes = quoteNotes;
    if (req.body.quoteHistory !== undefined) os.quoteHistory = req.body.quoteHistory;

    if (technicianId !== undefined) {
      const tech = usersStore.find((u) => u.id === technicianId);
      os.technicianId = tech ? tech.id : undefined;
      os.technicianName = tech ? tech.name : undefined;
    }

    // Auto-generate system note when status changes to Finalizado pelo Técnico
    if (status && status !== oldStatus && (status === 'Finalizado pelo Técnico' || status === 'Finalizado')) {
      const solutionText = technicalSolution ? ` Resumo do serviço: "${technicalSolution}".` : '';
      os.notes.unshift({
        id: `n-${Date.now()}`,
        authorName: req.user?.name || 'Técnico',
        authorRole: req.user?.role || 'technician',
        content: ` Atendimento técnico concluído com sucesso.${solutionText} Chamado encaminhado para revisão e encerramento financeiro pelo Administrador.`,
        createdAt: new Date().toISOString(),
      });
    }

    // Auto-generate system note when status changes to Encerrado
    if (status && status !== oldStatus && status === 'Encerrado') {
      os.closedAt = new Date().toISOString();
      os.closedBy = req.user?.name || 'Administrador';
      const formattedTotal = (os.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      os.notes.unshift({
        id: `n-${Date.now()}`,
        authorName: req.user?.name || 'Administrador',
        authorRole: 'admin',
        content: ` OS encerrada e faturada com sucesso pelo Administrador. Valor Total: ${formattedTotal} (${os.paymentMethod || 'A combinar'}).`,
        createdAt: new Date().toISOString(),
      });
    }

    os.updatedAt = new Date().toISOString();
    os.stalledHours = 0; // Reset stalled timer on update

    // Audit Log
    const changes: string[] = [];
    if (status && status !== oldStatus) changes.push(`Status: ${oldStatus} ➔ ${status}`);
    if (os.technicianName !== oldTechName) changes.push(`Técnico: ${oldTechName || 'Nenhum'} ➔ ${os.technicianName || 'Nenhum'}`);
    if (totalCost !== undefined) changes.push(`Valor Total: R$ ${totalCost}`);

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'sys',
      userName: req.user?.name || 'Sistema',
      userRole: req.user?.role || 'admin',
      action: status === 'Encerrado' ? 'ENCERRAR_OS' : 'ATUALIZAR_OS',
      targetId: os.id,
      details: changes.length ? changes.join(' | ') : `Atualizou informações da ${os.id}`,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.unshift(audit);

    notifyAll(
      `Atualização na ${os.id}`,
      `Status: ${os.status} | Cliente: ${os.clientName}`,
      status === 'Encerrado' ? 'success' : 'info',
      os.id
    );

    res.json(os);
  });

  app.post('/api/service-orders/:id/notes', authenticateToken, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'O conteúdo da nota é obrigatório.' });
    }

    const os = serviceOrdersStore.find((item) => item.id === id);
    if (!os) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    const newNote: ServiceOrderNote = {
      id: `n-${Date.now()}`,
      authorName: req.user?.name || 'Técnico',
      authorRole: req.user?.role || 'technician',
      content,
      createdAt: new Date().toISOString(),
    };

    os.notes.unshift(newNote);
    os.updatedAt = new Date().toISOString();
    os.stalledHours = 0; // Activity resets stalled status

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'sys',
      userName: req.user?.name || 'Técnico',
      userRole: req.user?.role || 'technician',
      action: 'NOVA_NOTA',
      targetId: os.id,
      details: `Adicionou um apontamento/andamento na ${os.id}`,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.unshift(audit);

    notifyAll(`Novo Apontamento na ${os.id}`, `${req.user?.name}: ${content.substring(0, 60)}...`, 'info', os.id);

    res.status(201).json(newNote);
  });

  // Checklist Endpoints (Supporting both /api/service-orders/:id/checklist and /api/os/:id/checklist)
  const getChecklistHandler = (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const checklist = checklistsStore[id] || [];
    res.json(checklist);
  };

  const saveChecklistHandler = (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const checklistData = req.body.checklist || req.body;
    if (Array.isArray(checklistData)) {
      checklistsStore[id] = checklistData;
      // Also update OS reference if found
      const os = serviceOrdersStore.find((o) => o.id === id);
      if (os) os.checklist = checklistData;
    }
    res.json({ success: true, checklist: checklistsStore[id] || [] });
  };

  app.get('/api/service-orders/:id/checklist', authenticateToken, getChecklistHandler);
  app.get('/api/os/:id/checklist', authenticateToken, getChecklistHandler);
  app.post('/api/service-orders/:id/checklist', authenticateToken, saveChecklistHandler);
  app.post('/api/os/:id/checklist', authenticateToken, saveChecklistHandler);

  app.delete('/api/service-orders/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir chamados.' });
    }

    const { id } = req.params;
    const index = serviceOrdersStore.findIndex((os) => os.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    const removed = serviceOrdersStore.splice(index, 1)[0];

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'EXCLUIR_OS',
      targetId: id,
      details: `Excluiu a ordem de serviço ${id} do cliente ${removed.clientName}`,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.unshift(audit);

    notifyAll(`Exclusão de OS`, `A ${id} foi removida pelo Administrador`, 'warning');

    res.json({ message: `Ordem de serviço ${id} excluída com sucesso.` });
  });

  // Admin Reset Database Endpoint
  app.post('/api/admin/reset-database', authenticateToken, (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem zerar o banco de dados.' });
    }
    serviceOrdersStore.length = 0;
    clientsStore.length = 0;
    auditLogsStore.length = 0;
    notificationsStore.length = 0;
    Object.keys(checklistsStore).forEach((key) => delete checklistsStore[key]);

    notifyAll('Banco Zerado', 'Todas as Ordens de Serviço e Clientes foram removidos. O sistema foi reiniciado.', 'warning');
    res.json({ message: 'Banco de dados zerado com sucesso. Próxima OS iniciará como OS-0001.' });
  });

  // Clients Endpoints
  app.get('/api/clients', authenticateToken, (req: Request, res: Response) => {
    clientsStore.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
    res.json(clientsStore);
  });

  app.post('/api/clients', authenticateToken, (req: AuthRequest, res: Response) => {
    const { name, cnpjOrCpf, email, phone, city, address, neighborhood, zipCode, latitude, longitude, coordinates } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
    }

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name,
      cnpjOrCpf: cnpjOrCpf || '',
      email: email || '',
      phone: phone || '',
      city: city || '',
      address: address || '',
      neighborhood: neighborhood || '',
      zipCode: zipCode || '',
      latitude: latitude !== undefined ? latitude : undefined,
      longitude: longitude !== undefined ? longitude : undefined,
      coordinates: coordinates || undefined,
      activeOrdersCount: 0,
    };

    clientsStore.push(newClient);
    clientsStore.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'sys',
      userName: req.user?.name || 'Sistema',
      userRole: req.user?.role || 'admin',
      action: 'CRIAR_CLIENTE',
      targetId: newClient.id,
      details: `Cadastrou novo cliente: ${name}`,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.unshift(audit);

    res.status(201).json(newClient);
  });

  app.put('/api/clients/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const clientIndex = clientsStore.findIndex((c) => c.id === id);

    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const { name, cnpjOrCpf, email, phone, city, address, neighborhood, zipCode, latitude, longitude, coordinates } = req.body;

    const existing = clientsStore[clientIndex];
    const updatedClient: Client = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      cnpjOrCpf: cnpjOrCpf !== undefined ? cnpjOrCpf : existing.cnpjOrCpf,
      email: email !== undefined ? email : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      city: city !== undefined ? city : existing.city,
      address: address !== undefined ? address : existing.address,
      neighborhood: neighborhood !== undefined ? neighborhood : existing.neighborhood,
      zipCode: zipCode !== undefined ? zipCode : existing.zipCode,
      latitude: latitude !== undefined ? latitude : existing.latitude,
      longitude: longitude !== undefined ? longitude : existing.longitude,
      coordinates: coordinates !== undefined ? coordinates : existing.coordinates,
    };

    clientsStore[clientIndex] = updatedClient;
    clientsStore.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

    // Update client name in active/existing orders if changed
    if (name && name !== existing.name) {
      serviceOrdersStore.forEach((o) => {
        if (o.clientId === id) {
          o.clientName = name;
        }
      });
    }

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'sys',
      userName: req.user?.name || 'Sistema',
      userRole: req.user?.role || 'admin',
      action: 'EDITAR_CLIENTE',
      targetId: id,
      details: `Atualizou dados do cliente: ${updatedClient.name}`,
      createdAt: new Date().toISOString(),
    };
    auditLogsStore.unshift(audit);

    res.json(updatedClient);
  });

  // Dashboard Stats
  function calculateDashboardStats(): DashboardStats {
    const totalOS = serviceOrdersStore.length;
    const abertas = serviceOrdersStore.filter((o) => o.status === 'Aberta').length;
    const emAndamento = serviceOrdersStore.filter((o) => o.status === 'Em Andamento').length;
    const aguardandoCliente = serviceOrdersStore.filter(
      (o) => o.status === 'Aguardando Cliente' || o.status === 'Aguardando Peças'
    ).length;
    const finalizadas = serviceOrdersStore.filter(
      (o) => o.status === 'Finalizado' || o.status === 'Encerrado'
    ).length;
    const atendExterno = serviceOrdersStore.filter(
      (o) => o.origin === 'Externa' || o.attendanceType === 'presential' || (o as any).serviceType === 'externo'
    ).length;

    const stalledOrders = serviceOrdersStore
      .filter((os) => (os.stalledHours || 0) >= 48 && os.status !== 'Finalizado' && os.status !== 'Encerrado')
      .sort((a, b) => (b.stalledHours || 0) - (a.stalledHours || 0));

    const technicians = usersStore.filter(
      (u) => (u.role || '').toLowerCase() === 'technician' || (u.role || '').toLowerCase() === 'tecnico'
    );
    const productivity: TechProductivity[] = technicians.map((tech) => {
      const techOrders = serviceOrdersStore.filter((os) => os.technicianId === tech.id);
      const inProgressCount = techOrders.filter(
        (os) => os.status === 'Em Andamento' || os.status === 'Aberta'
      ).length;
      const completedCount = techOrders.filter(
        (os) => os.status === 'Finalizado' || os.status === 'Encerrado'
      ).length;
      return {
        technicianId: tech.id,
        technicianName: tech.name,
        totalAssigned: techOrders.length,
        inProgressCount,
        completedCount,
        avgResolutionHours: 2.5,
      };
    });

    return {
      totalOS,
      abertas,
      emAndamento,
      aguardandoCliente,
      finalizadas,
      atendExterno,
      stalledOrders,
      productivity,
    };
  }

  app.get('/api/dashboard/stats', authenticateToken, (req: Request, res: Response) => {
    res.json(calculateDashboardStats());
  });

  // Audit Logs
  app.get('/api/logs', authenticateToken, (req: Request, res: Response) => {
    res.json(auditLogsStore.slice(0, 50));
  });

  // Notifications
  app.get('/api/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
    const userNotifs = notificationsStore.filter(
      (n) => n.userId === 'all' || n.userId === req.user?.id
    );
    res.json(userNotifs.slice(0, 20));
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });

  // User status toggle
  const toggleUserStatusHandler = (req: Request, res: Response) => {
    const { id } = req.params;
    const user = usersStore.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    user.active = !user.active;
    res.json({ success: true, user });
  };
  app.put('/api/users/:id/toggle-status', authenticateToken, toggleUserStatusHandler);
  app.patch('/api/users/:id/toggle-status', authenticateToken, toggleUserStatusHandler);

  // Maintenance & System Health
  app.get('/api/admin/maintenance/status', authenticateToken, (req: Request, res: Response) => {
    const mem = process.memoryUsage();
    res.json({
      systemStatus: 'ONLINE',
      maintenanceMode: false,
      uptimeSeconds: Math.floor(process.uptime()),
      dbConnected: false,
      stats: {
        totalOrders: serviceOrdersStore.length,
        totalClients: clientsStore.length,
        totalLogs: auditLogsStore.length,
        totalStaffUsers: usersStore.length,
        allowedRoles: ['admin', 'technician', 'super_admin'],
      },
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      serverTime: new Date().toISOString(),
    });
  });

  app.post('/api/admin/maintenance/clean-logs', authenticateToken, (req: Request, res: Response) => {
    auditLogsStore.length = 0;
    res.json({ success: true, message: 'Logs de auditoria limpos com sucesso.' });
  });

  app.get('/api/admin/maintenance/backup', authenticateToken, (req: Request, res: Response) => {
    const backup = {
      exportedAt: new Date().toISOString(),
      users: usersStore,
      clients: clientsStore,
      serviceOrders: serviceOrdersStore,
      auditLogs: auditLogsStore,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="plioou_backup.json"');
    res.json(backup);
  });

  app.post('/api/database/clear', authenticateToken, (req: Request, res: Response) => {
    serviceOrdersStore.length = 0;
    clientsStore.length = 0;
    auditLogsStore.length = 0;
    notificationsStore.length = 0;
    Object.keys(checklistsStore).forEach((key) => delete checklistsStore[key]);
    notifyAll('Banco Zerado', 'Todas as Ordens de Serviço foram removidas.', 'warning');
    res.json({ success: true, message: 'Banco de dados zerado com sucesso.' });
  });

  app.post('/api/database/restore', authenticateToken, (req: Request, res: Response) => {
    const data = req.body;
    if (data?.clients && Array.isArray(data.clients)) {
      clientsStore.length = 0;
      clientsStore.push(...data.clients);
    }
    if (data?.serviceOrders && Array.isArray(data.serviceOrders)) {
      serviceOrdersStore.length = 0;
      serviceOrdersStore.push(...data.serviceOrders);
    }
    notifyAll('Banco Restaurado', 'Dados restaurados a partir de backup.', 'info');
    res.json({ success: true, message: 'Restauração de backup concluída com sucesso.' });
  });

  // Reports
  app.get('/api/reports/productivity', authenticateToken, (req: Request, res: Response) => {
    const techMap = new Map<string, any>();
    usersStore.forEach((u) => {
      techMap.set(u.id, {
        tecnico_id: u.id,
        tecnico_nome: u.name,
        tecnico_email: u.email,
        total_atribuidas: 0,
        resolvidas: 0,
        abertas_em_andamento: 0,
        tempo_medio_resolucao_horas: 3.5,
      });
    });

    serviceOrdersStore.forEach((os) => {
      if (os.technicianId && techMap.has(os.technicianId)) {
        const row = techMap.get(os.technicianId);
        row.total_atribuidas++;
        if (os.status === 'Finalizado' || os.status === 'Encerrado') {
          row.resolvidas++;
        } else {
          row.abertas_em_andamento++;
        }
      }
    });

    res.json(Array.from(techMap.values()));
  });

  app.get('/api/reports/daily', authenticateToken, (req: Request, res: Response) => {
    res.json({
      date: new Date().toISOString().split('T')[0],
      totalCreated: serviceOrdersStore.length,
      totalClosed: serviceOrdersStore.filter((o) => o.status === 'Finalizado' || o.status === 'Encerrado').length,
      totalPending: serviceOrdersStore.filter((o) => o.status !== 'Finalizado' && o.status !== 'Encerrado').length,
    });
  });

  // Serve Frontend Assets
  // In dev mode (tsx server.ts), always mount Vite middleware so HMR and on-the-fly bundling are active
  const isBundled = (typeof __filename !== 'undefined' && __filename.endsWith('.cjs')) || process.argv[1]?.endsWith('.cjs');
  const shouldServeStatic = (process.env.SERVE_STATIC === 'true' || isBundled);

  const distInCurrent = path.join(appDir, 'index.html');
  const distInSubdir = path.join(appDir, 'dist', 'index.html');

  let distDir: string | null = null;
  if (fs.existsSync(distInCurrent)) {
    distDir = appDir;
  } else if (fs.existsSync(distInSubdir)) {
    distDir = path.join(appDir, 'dist');
  }

  if (shouldServeStatic && distDir) {
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      const targetIndex = path.join(distDir!, 'index.html');
      if (fs.existsSync(targetIndex)) {
        res.sendFile(targetIndex);
      } else {
        res.status(404).send('Página não encontrada.');
      }
    });
  } else {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware initialization notice, falling back to static dist:', viteErr);
      if (distDir) {
        app.use(express.static(distDir));
        app.get('*', (req: Request, res: Response) => {
          const targetIndex = path.join(distDir!, 'index.html');
          if (fs.existsSync(targetIndex)) {
            res.sendFile(targetIndex);
          } else {
            res.status(404).send('Página não encontrada.');
          }
        });
      }
    }
  }

  server.listen(PORT, HOST, () => {
    console.log(`Pliioou TI Server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
