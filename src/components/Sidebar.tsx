import React from 'react';
import {
  LayoutDashboard,
  FileText,
  MapPin,
  Users,
  BarChart3,
  History,
  LogOut,
  Cpu,
  Wrench,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchUser?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const roleUpper = (currentUser.role || '').toUpperCase();
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN';
  const isAdmin = roleUpper === 'ADMIN' || isSuperAdmin;

  const roleLabel = isSuperAdmin ? 'Super Admin' : (roleUpper === 'ADMIN' ? 'Administrador' : 'Técnico');

  // REQUISITO 1: 'Logs do Sistema' é visível EXCLUSIVAMENTE para usuários com a role 'SUPER_ADMIN'
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'orders', label: 'Ordens de serviço', icon: FileText },
    { id: 'external', label: 'Atender. Externo', icon: MapPin },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'users_management', label: 'Equipe de TI', icon: Users, adminOnly: true },
    { id: 'admin_dashboard', label: 'Produtividade (Admin)', icon: BarChart3, adminOnly: true },
    { id: 'reports', label: 'Relatórios Gerenciais', icon: FileText, adminOnly: true },
    { id: 'admin-manutencao', label: 'Manutenção do Sistema', icon: Wrench, superAdminOnly: true },
    { id: 'logs', label: 'Logs do Sistema', icon: History, superAdminOnly: true },
  ];

  return (
    <aside className="w-64 bg-[#0a1128] text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800/60 shadow-2xl select-none z-20">
      {/* Brand Header - Nomenclatura oficial Plioou */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight leading-tight">Plioou</h1>
          <p className="text-[11px] text-slate-400 font-medium">Gestão de TI</p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4">
        <div className="bg-[#131d38] border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-blue-600/90 text-white flex items-center justify-center font-bold text-base shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{currentUser.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-medium text-slate-400">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Menu
        </div>
        {menuItems.map((item) => {
          if (item.superAdminOnly && !isSuperAdmin) return null;
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id || (activeTab === 'dashboard-tecnico' && item.id === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
            </button>
          );
        })}
      </div>

      {/* Bottom Logout - REQUISITO 5: Apenas botão de logout seguro, sem 'Trocar de Conta' redundante */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};
