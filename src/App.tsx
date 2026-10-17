import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  User,
  Role,
  ServiceOrder,
  Client,
  DashboardStats,
  AuditLog,
  Notification,
  OSStatus,
  OSPriority,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { EmployeeOrdersView } from './components/EmployeeOrdersView';
import { ExternalServiceView } from './components/ExternalServiceView';
import { ClientsView } from './components/ClientsView';
import { UsersManagementView } from './components/UsersManagementView';
import { AdminDashboard } from './components/AdminDashboard';
import { ReportsView } from './components/ReportsView';
import { AdminMaintenanceView } from './components/AdminMaintenanceView';
import { AuditLogsView } from './components/AuditLogsView';
import { CreateOSModal } from './components/CreateOSModal';
import { OSDetailDrawer } from './components/OSDetailDrawer';
import { CheckCircle2, UserCheck, Shield, RefreshCw } from 'lucide-react';

const INITIAL_ADMIN_USER: User = {
  id: 'u-1',
  name: 'Rogerio (Admin)',
  email: 'rogerio@plioou.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  active: true,
};

const DEFAULT_STATS: DashboardStats = {
  totalOS: 0,
  abertas: 0,
  emAndamento: 0,
  aguardandoCliente: 0,
  finalizadas: 0,
  atendExterno: 0,
  stalledOrders: [],
  productivity: [],
};

export default function App() {
  // Current user state (persisted or defaults to Admin Rogerio)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('@Pliioou:user');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_ADMIN_USER;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleSwitchFeedback, setRoleSwitchFeedback] = useState<string | null>(null);

  // Sync user changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('@Pliioou:user', JSON.stringify(currentUser));
    } catch {
      // Ignore
    }
  }, [currentUser]);

  // Headers for API calls
  const authHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo_token',
      'x-dev-user-id': currentUser.id,
    };
  }, [currentUser.id]);

  // Fetch all core system data
  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, clientsRes, usersRes, statsRes, notifsRes, logsRes] = await Promise.all([
        fetch('/api/service-orders', { headers: authHeaders }),
        fetch('/api/clients', { headers: authHeaders }),
        fetch('/api/users', { headers: authHeaders }),
        fetch('/api/dashboard/stats', { headers: authHeaders }),
        fetch('/api/notifications', { headers: authHeaders }),
        fetch('/api/logs', { headers: authHeaders }),
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (err) {
      console.warn('Erro ao carregar dados do servidor:', err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time socket updates
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket?.emit('join_user', currentUser.id);
      });

      socket.on('os_updated', () => {
        fetchData();
      });

      socket.on('notification', (newNotif: Notification) => {
        setNotifications((prev) => [newNotif, ...prev]);
        fetchData();
      });
    } catch (e) {
      console.warn('Socket realtime offline, fallback ativo:', e);
    }

    return () => {
      socket?.disconnect();
    };
  }, [currentUser.id, fetchData]);

  // Fast profile switch (Admin, Técnico, Super Admin) without passwords or secret prompts
  const handleQuickSwitchUser = (targetRole: 'admin' | 'technician' | 'SUPER_ADMIN') => {
    let newUser: User;
    if (targetRole === 'admin') {
      newUser = {
        id: 'u-1',
        name: 'Rogerio (Admin)',
        email: 'rogerio@plioou.com',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        active: true,
      };
    } else if (targetRole === 'SUPER_ADMIN') {
      newUser = {
        id: 'u-1',
        name: 'Rogerio (Super Admin)',
        email: 'diretoria@plioou.com',
        role: 'SUPER_ADMIN',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        active: true,
      };
    } else {
      newUser = {
        id: 'u-2',
        name: 'Leonardo (Técnico)',
        email: 'leonardo@plioou.com',
        role: 'technician',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        active: true,
      };
    }

    setCurrentUser(newUser);
    setRoleSwitchFeedback(`Perfil alterado para ${newUser.name}`);
    setTimeout(() => setRoleSwitchFeedback(null), 3000);
  };

  // Actions
  const handleCreateOS = async (data: {
    clientId: string;
    clientName: string;
    equipment: string;
    category: string;
    description: string;
    priority: OSPriority;
    technicianId?: string;
  }) => {
    try {
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao criar OS:', err);
    }
  };

  const handleUpdateOSStatus = async (
    osId: string,
    status: OSStatus,
    technicianId?: string
  ) => {
    try {
      const res = await fetch(`/api/service-orders/${osId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status, technicianId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedOrder(updated);
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao atualizar OS:', err);
    }
  };

  const handleAddOSNote = async (osId: string, noteContent: string) => {
    try {
      const res = await fetch(`/api/service-orders/${osId}/notes`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        // Refetch detailed order
        const getRes = await fetch(`/api/service-orders?search=${osId}`, { headers: authHeaders });
        if (getRes.ok) {
          const matched = await getRes.json();
          const target = matched.find((o: ServiceOrder) => o.id === osId);
          if (target) setSelectedOrder(target);
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao adicionar nota:', err);
    }
  };

  const handleDeleteOS = async (osId: string) => {
    try {
      const res = await fetch(`/api/service-orders/${osId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        setSelectedOrder(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao excluir OS:', err);
    }
  };

  const handleAddClient = async (data: {
    name: string;
    cnpjOrCpf: string;
    email: string;
    phone: string;
    city: string;
  }) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao cadastrar cliente:', err);
    }
  };

  const handleAddUser = async (data: {
    name: string;
    email: string;
    role: Role | string;
  }) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchData();
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Erro ao criar usuário' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: authHeaders,
      });
      if (res.ok) {
        await fetchData();
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Tem certeza de que deseja zerar todas as Ordens de Serviço?')) return;
    try {
      const res = await fetch('/api/database/clear', {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao zerar banco:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: authHeaders,
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Erro ao marcar notificações:', err);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => handleQuickSwitchUser('technician')}
        onSwitchUser={() => handleQuickSwitchUser(currentUser.role === 'admin' ? 'technician' : 'admin')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header with Notifications & Quick Profile Switcher */}
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          notifications={notifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onRefreshData={fetchData}
          onSwitchUser={() => handleQuickSwitchUser(currentUser.role === 'admin' ? 'technician' : 'admin')}
        />

        {/* Quick Role Switcher Banner (Never prompts for secrets) */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Ambiente Conectado:</span>
            <span>Plioou TI &bull; Sem necessidade de digitar credenciais ou secrets</span>
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span className="text-slate-400">Alternar Acesso:</span>
            <button
              onClick={() => handleQuickSwitchUser('admin')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                currentUser.role === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              onClick={() => handleQuickSwitchUser('SUPER_ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                currentUser.role === 'SUPER_ADMIN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Super Admin
            </button>
            <button
              onClick={() => handleQuickSwitchUser('technician')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                currentUser.role === 'technician'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Técnico
            </button>
          </div>
        </div>

        {/* Role Switch Feedback Toast */}
        {roleSwitchFeedback && (
          <div className="bg-emerald-600 text-white px-4 py-1.5 text-center text-xs font-semibold animate-in fade-in duration-200">
            {roleSwitchFeedback}
          </div>
        )}

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' || activeTab === 'dashboard-tecnico' ? (
            <DashboardView
              stats={stats}
              orders={orders}
              userName={currentUser.name}
              onSelectOrder={setSelectedOrder}
              onOpenNewOrder={() => setIsCreateModalOpen(true)}
              onViewAllOrders={() => setActiveTab('orders')}
            />
          ) : activeTab === 'orders' ? (
            <EmployeeOrdersView
              orders={orders}
              userName={currentUser.name}
              onOpenNewOrder={() => setIsCreateModalOpen(true)}
              onSelectOrder={setSelectedOrder}
            />
          ) : activeTab === 'external' ? (
            <ExternalServiceView
              orders={orders}
              clients={clients}
              onSelectOrder={setSelectedOrder}
              onCreateNew={() => setIsCreateModalOpen(true)}
            />
          ) : activeTab === 'clients' ? (
            <ClientsView clients={clients} onAddClient={handleAddClient} />
          ) : activeTab === 'users_management' ? (
            <UsersManagementView
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onToggleUserStatus={handleToggleUserStatus}
            />
          ) : activeTab === 'admin_dashboard' ? (
            <AdminDashboard
              stats={stats}
              allOrders={orders}
              onSelectOrder={setSelectedOrder}
              onClearDatabase={handleClearDatabase}
            />
          ) : activeTab === 'reports' ? (
            <ReportsView currentUser={currentUser} users={users} onSelectOrder={setSelectedOrder} />
          ) : activeTab === 'admin-manutencao' ? (
            <AdminMaintenanceView currentUser={currentUser} onRefreshData={fetchData} />
          ) : activeTab === 'logs' ? (
            <AuditLogsView logs={logs} currentUser={currentUser} />
          ) : (
            <DashboardView
              stats={stats}
              orders={orders}
              userName={currentUser.name}
              onSelectOrder={setSelectedOrder}
              onOpenNewOrder={() => setIsCreateModalOpen(true)}
              onViewAllOrders={() => setActiveTab('orders')}
            />
          )}
        </main>
      </div>

      {/* Create Service Order Modal */}
      <CreateOSModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clients={clients}
        technicians={users.filter(
          (u) => u.role === 'technician' || u.role === 'TECNICO' || u.role === 'admin'
        )}
        onSubmit={handleCreateOS}
      />

      {/* Service Order Detail Drawer */}
      <OSDetailDrawer
        os={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        technicians={users}
        currentUser={currentUser}
        onUpdateStatus={handleUpdateOSStatus}
        onAddNote={handleAddOSNote}
        onDeleteOS={handleDeleteOS}
      />
    </div>
  );
}
