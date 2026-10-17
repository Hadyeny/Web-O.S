import React, { useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Shield,
  ShieldCheck,
  Search,
  X,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  UserX,
  Power,
  RotateCcw,
  Sparkles,
  List,
  LayoutGrid,
} from 'lucide-react';
import { User, Role } from '../types';
import { safeFetch } from '../utils/api';

interface UsersManagementViewProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (data: {
    name: string;
    email: string;
    role: Role | string;
  }) => Promise<{ success: boolean; error?: string } | void> | void;
  onToggleUserStatus?: (userId: string) => Promise<{ success: boolean; error?: string } | void> | void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onToggleUserStatus,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'TECNICO'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Form states (Apenas Nome, Email e Role - sem senha provisória manual)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TECNICO'>('TECNICO');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currentUserRole = (currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Stats calculation
  const totalUsers = users.length;
  const totalSuperAdmins = users.filter((u) => (u.role || '').toUpperCase() === 'SUPER_ADMIN').length;
  const totalAdmins = users.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length;
  const totalTechnicians = users.filter((u) => {
    const r = (u.role || '').toUpperCase();
    return r === 'TECNICO' || r === 'TECHNICIAN';
  }).length;
  const totalAtivos = users.filter((u) => u.ativo !== false).length;

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.role || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (roleFilter === 'ALL') return true;
    const r = (user.role || '').toUpperCase();
    if (roleFilter === 'TECNICO') return r === 'TECNICO' || r === 'TECHNICIAN';
    return r === roleFilter;
  });

  const handleOpenModal = () => {
    setName('');
    setEmail('');
    setRole('TECNICO');
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Por favor, informe o nome completo e o e-mail corporativo.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await onAddUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });

      if (res && res.success === false) {
        setErrorMessage(res.error || 'Falha ao registrar técnico.');
      } else {
        setShowModal(false);
        setName('');
        setEmail('');
        setRole('TECNICO');
        setSuccessToast(`Novo técnico "${name.trim()}" provisionado com sucesso! Log de auditoria registrado.`);
        setTimeout(() => setSuccessToast(null), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar o cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  // Alternância de status Ativo/Inativo (Requisito 3)
  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      setErrorMessage('Operação bloqueada: você não pode suspender sua própria conta ativa de administrador.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setTogglingId(user.id);
    setErrorMessage(null);

    try {
      if (onToggleUserStatus) {
        const res = await onToggleUserStatus(user.id);
        if (res && res.success === false) {
          setErrorMessage(res.error || 'Falha ao alternar status do usuário.');
          return;
        }
      } else {
        const res = await safeFetch(`/api/users/${encodeURIComponent(user.id)}/toggle-status`, {
          method: 'PUT',
          credentials: 'include',
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setErrorMessage(errData.message || errData.error || 'Falha ao alternar status da conta.');
          return;
        }
      }

      const isNowActive = user.ativo === false;
      const statusLabel = isNowActive ? 'ativada' : 'desativada';
      setSuccessToast(`A conta do usuário "${user.name}" foi ${statusLabel} com sucesso.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar ao servidor para alternar status.');
    } finally {
      setTogglingId(null);
    }
  };

  const getRoleBadge = (rawRole: string) => {
    const r = (rawRole || '').toUpperCase();
    if (r === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldCheck className="w-3 h-3 text-purple-600" />
          Super Admin
        </span>
      );
    }
    if (r === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Shield className="w-3 h-3 text-blue-600" />
          Administrador
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <UserCheck className="w-3 h-3 text-emerald-600" />
        Técnico de TI
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-white hover:text-emerald-100 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerta de Erro Geral */}
      {errorMessage && !showModal && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Equipe Técnica & Controle de Acessos
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mt-1">Gestão de Equipe & Técnicos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bloqueio, reativação imediata e auditoria de credenciais com permissões RBAC no SaaS Plioou.
          </p>
        </div>

        {/* Botão de Cadastro - Apenas SUPER_ADMIN */}
        {isSuperAdmin ? (
          <button
            onClick={handleOpenModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Provisionar Novo Técnico</span>
          </button>
        ) : (
          <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 font-medium rounded-xl text-xs flex items-center gap-1.5 shrink-0">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Visualização de Administrador</span>
          </div>
        )}
      </div>

      {/* Cards de Resumo da Equipe */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Membros</p>
            <p className="text-lg font-black text-slate-800">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Super Admins</p>
            <p className="text-lg font-black text-slate-800">{totalSuperAdmins}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contas Ativas</p>
            <p className="text-lg font-black text-emerald-600">{totalAtivos}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suspensos / Bloqueados</p>
            <p className="text-lg font-black text-amber-600">{totalUsers - totalAtivos}</p>
          </div>
        </div>
      </div>

      {/* Barra de Busca, Filtros e Alternância de Visualização */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou perfil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'SUPER_ADMIN', 'ADMIN', 'TECNICO'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRoleFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  roleFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab === 'ALL'
                  ? 'Todos'
                  : tab === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : tab === 'ADMIN'
                  ? 'Administrador'
                  : 'Técnicos'}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              title="Modo Tabela"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Modo Grade"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Renderização da Tabela de Usuários com Coluna de Ação (Requisito 3) */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Nenhum membro encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não foram localizados usuários que correspondam aos filtros pesquisados.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Técnico / Membro</th>
                  <th className="py-3.5 px-4">E-mail Corporativo</th>
                  <th className="py-3.5 px-4">Perfil de Acesso</th>
                  <th className="py-3.5 px-4">Status no Sistema</th>
                  <th className="py-3.5 px-4 text-right">Ações de Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user) => {
                  const isMe = currentUser?.id === user.id;
                  const isActive = user.ativo !== false;
                  const isPending = togglingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isActive ? 'bg-slate-50/40 opacity-90' : ''
                      }`}
                    >
                      {/* Técnico / Membro */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover rounded-xl"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{user.name}</span>
                              {isMe && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {user.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* E-mail Corporativo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Perfil de Acesso */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Status no Sistema */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Suspenso / Inativo
                          </span>
                        )}
                      </td>

                      {/* Coluna de Ações com Toggle Button (Requisito 3) */}
                      <td className="py-3.5 px-4 text-right">
                        {isMe ? (
                          <span className="text-[11px] font-semibold text-slate-400 italic">
                            Conta Ativa Principal
                          </span>
                        ) : isSuperAdmin ? (
                          isActive ? (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isPending}
                              title="Suspender acesso deste usuário ao sistema"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm hover:border-rose-300 disabled:opacity-50"
                            >
                              {isPending ? (
                                <span className="inline-block w-3.5 h-3.5 border-2 border-rose-700 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <Power className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>Desativar Conta</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isPending}
                              title="Reativar acesso deste usuário ao sistema"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm hover:border-emerald-300 disabled:opacity-50"
                            >
                              {isPending ? (
                                <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>Ativar Conta</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">Restrito a Super Admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visualização em Cartões */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isMe = currentUser?.id === user.id;
            const isActive = user.ativo !== false;
            const isPending = togglingId === user.id;

            return (
              <div
                key={user.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition space-y-4 relative ${
                  isActive ? 'border-slate-200 hover:border-blue-300' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-800 text-sm truncate leading-tight">
                          {user.name}
                        </h3>
                        {isMe && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        ID: {user.id}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">{getRoleBadge(user.role)}</div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Status</span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Suspenso
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão de Alternância de Status no Card */}
                {isSuperAdmin && !isMe && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    {isActive ? (
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={isPending}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                      >
                        {isPending ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-rose-700 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Power className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>Desativar Conta</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={isPending}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                      >
                        {isPending ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>Ativar Conta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro de Novo Membro (Sem campo de senha - Convite Limpo) */}
      {showModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Provisionar Novo Técnico</h3>
                  <p className="text-[11px] text-slate-400">Cadastro limpo com auditoria automática</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso Informativo de Segurança */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Convite de Acesso Seguro:</span> O sistema gerará automaticamente uma credencial provisória criptografada e registrará o log de auditoria no PostgreSQL.
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Oliveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="carlos@plioou.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Função / Perfil de Acesso
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'TECNICO')}
                    disabled={submitting}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="TECNICO">Técnico de TI (Atendimento e OSs)</option>
                    <option value="ADMIN">Administrador (Métricas & Visão Global)</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {role === 'ADMIN'
                    ? 'O Administrador acumula funções de supervisão e acompanhamento de métricas.'
                    : 'O Técnico possui acesso a ordens de serviço e atendimentos de campo.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
                >
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Provisionando...' : 'Provisionar Técnico'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
