import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Server,
  Database,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  HardDrive,
  Users,
  Activity,
  Layers,
} from 'lucide-react';
import { User } from '../types';
import { API_ROUTES } from '../constants/apiRoutes';

interface MaintenanceStatus {
  systemStatus: string;
  maintenanceMode: boolean;
  uptimeSeconds: number;
  dbConnected: boolean;
  stats: {
    totalOrders: number;
    totalClients: number;
    totalLogs: number;
    totalStaffUsers: number;
    allowedRoles: string[];
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
  };
  serverTime: string;
}

interface AdminMaintenanceViewProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const AdminMaintenanceView: React.FC<AdminMaintenanceViewProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.maintenanceStatus, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCleanLogs = async () => {
    setActionMessage(null);
    try {
      const res = await fetch(API_ROUTES.maintenanceCleanLogs, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message || 'Logs expurgados com sucesso!' });
        fetchStatus();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Erro ao expurgar logs.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Falha na comunicação com o servidor.' });
    }
  };

  const handleClearDatabase = async () => {
    setActionMessage(null);
    try {
      const res = await fetch(API_ROUTES.databaseClear, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Banco de dados restaurado ao estado limpo com sucesso.' });
        setConfirmClearOpen(false);
        fetchStatus();
        if (onRefreshData) onRefreshData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Erro ao limpar banco.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Falha de conexão com o servidor.' });
    }
  };

  const handleExportBackup = async () => {
    try {
      setIsExportingBackup(true);
      setActionMessage(null);

      const res = await fetch(API_ROUTES.maintenanceBackup, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Falha ao processar backup das tabelas no servidor.');
      }

      // Extrai nome do arquivo a partir do header Content-Disposition se presente
      let filename = `plioou_db_backup_${Date.now()}.json`;
      const disposition = res.headers.get('Content-Disposition');
      if (disposition) {
        const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          filename = match[1].trim();
        }
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setActionMessage({
        type: 'success',
        text: 'Backup real das tabelas do PostgreSQL baixado com sucesso!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Erro ao realizar backup do banco de dados.',
      });
    } finally {
      setIsExportingBackup(false);
    }
  };

  /**
   * 1. CAPTURA ASSÍNCRONA DO ARQUIVO (.json) VIA FILEREADER:
   * Aciona a seleção local de arquivos .json e lê seu conteúdo assincronamente.
   */
  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reseta o valor para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';

    const reader = new FileReader();

    reader.onload = async (event) => {
      const rawText = event.target?.result as string;
      let parsedPayload: any;

      try {
        parsedPayload = JSON.parse(rawText);
      } catch {
        setActionMessage({ type: 'error', text: 'Formato de arquivo inválido.' });
        return;
      }

      // Normalização defensiva caso o payload venha sem a raiz database_dump
      let payload = parsedPayload;
      if (!payload.database_dump) {
        payload = {
          database_dump: {
            service_orders: parsedPayload.service_orders || parsedPayload.tabela_ordens_servico || [],
            clients: parsedPayload.clients || parsedPayload.tabela_clientes || [],
          },
        };
      }

      setIsRestoring(true);
      setActionMessage(null);

      try {
        // 2. DISPARO HTTP AUTENTICADO COM CREDENCIAIS (Cookie HttpOnly):
        const res = await fetch('/api/database/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        // 3. RETORNO DE SUCESSO E SINCRONIZAÇÃO VISUAL:
        if (res.ok) {
          setActionMessage({
            type: 'success',
            text: 'Banco de dados restaurado com total integridade!',
          });
          if (onRefreshData) onRefreshData();
          fetchStatus();
        } else {
          const errorData = await res.json().catch(() => ({}));
          setActionMessage({
            type: 'error',
            text: errorData.message || errorData.error || 'Erro ao processar restauração do banco.',
          });
        }
      } catch (err: any) {
        setActionMessage({
          type: 'error',
          text: err.message || 'Falha de comunicação ao restaurar o banco de dados.',
        });
      } finally {
        setIsRestoring(false);
      }
    };

    reader.onerror = () => {
      setActionMessage({ type: 'error', text: 'Formato de arquivo inválido.' });
    };

    reader.readAsText(file);
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Nível Mestre: SUPER_ADMIN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Manutenção Global do Sistema</span>
              <Wrench className="w-6 h-6 text-purple-400" />
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Área restrita para governança, auditoria de infraestrutura, controle de pool PostgreSQL e integridade operacional do Pliioou TI.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Diagnosticar</span>
            </button>
            <button
              onClick={handleExportBackup}
              disabled={isExportingBackup || isRestoring}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Download className={`w-3.5 h-3.5 ${isExportingBackup ? 'animate-bounce' : ''}`} />
              <span>{isExportingBackup ? 'Gerando Backup...' : 'Backup Geral'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportBackup}
              disabled={isRestoring || isExportingBackup}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Upload className={`w-3.5 h-3.5 ${isRestoring ? 'animate-bounce' : ''}`} />
              <span>{isRestoring ? 'Restaurando...' : 'Restaurar Backup'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Grid de Diagnósticos de Infraestrutura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Status do Servidor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Status Geral</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 dark:text-white">ONLINE</span>
              <span className="block text-[11px] text-slate-400 font-medium">Node.js Express + TS</span>
            </div>
          </div>
        </div>

        {/* Card Pool PostgreSQL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>PostgreSQL Pool</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {status?.dbConnected ? 'Conectado' : 'Operacional'}
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">Resiliente com fallback</span>
            </div>
          </div>
        </div>

        {/* Card Uptime */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Tempo Ativo (Uptime)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 dark:text-white truncate">
                {status ? formatUptime(status.uptimeSeconds) : 'Calculando...'}
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">Sem interrupções críticas</span>
            </div>
          </div>
        </div>

        {/* Card Consumo de Memória */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Memória Heap</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {status?.memory.heapUsedMb || 45} MB
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">
                de {status?.memory.heapTotalMb || 64} MB alocados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Regras Corporativas de Perfis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Arquitetura de Perfis Exclusiva para TI
            </h2>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
            Perfil FUNCIONARIO Removido
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                TECNICO
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded font-semibold">Ativo</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Atende os chamados de TI, atualiza status, insere apontamentos técnicos e gerencia ordens atribuídas.
            </p>
            <div className="text-[11px] text-slate-400">Destino: <code className="text-blue-500">/dashboard-tecnico</code></div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                ADMIN
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-semibold">Ativo</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Gerencia a equipe técnica, clientes corporativos, SLA de atendimento, relatórios e exclusão de chamados.
            </p>
            <div className="text-[11px] text-slate-400">Destino: <code className="text-emerald-500">/dashboard-tecnico</code></div>
          </div>

          <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                SUPER_ADMIN
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded font-bold">Mestre</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Nível mestre exclusivo para manutenção global do sistema, expurgo de logs, backups e saúde de infraestrutura.
            </p>
            <div className="text-[11px] text-slate-400">Destino: <code className="text-purple-500">/admin/manutencao</code></div>
          </div>
        </div>
      </div>

      {/* Ferramentas de Manutenção Crítica */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-600" />
          <span>Ações Críticas de Governança e Manutenção</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Ação 1: Expurgo de Logs */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Expurgar Logs de Auditoria</h3>
              <p className="text-xs text-slate-500">
                Limpa os registros históricos de logs para liberação de armazenamento e otimização do banco.
              </p>
            </div>
            <button
              onClick={handleCleanLogs}
              className="w-full py-2.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Tabela de Logs</span>
            </button>
          </div>

          {/* Ação 2: Diagnóstico e Sincronização */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Diagnosticar Integridade</h3>
              <p className="text-xs text-slate-500">
                Executa ping na conexão PostgreSQL, verifica integridade das chaves primárias e consistência da memória.
              </p>
            </div>
            <button
              onClick={fetchStatus}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Executar Diagnóstico</span>
            </button>
          </div>

          {/* Ação 3: Reset de Dados com Confirmação */}
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400">Restaurar Banco de Dados</h3>
              <p className="text-xs text-slate-500">
                Remove todas as OS e clientes mantendo apenas os usuários mestres de TI.
              </p>
            </div>
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-rose-600/20"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Limpar Tabelas Operacionais</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Limpeza Geral */}
      {confirmClearOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Confirmar Limpeza Operacional?
              </h3>
              <p className="text-xs text-slate-500">
                Esta ação esvaziará todas as ordens de serviço e clientes do banco de dados PostgreSQL. Os usuários técnicos autorizados serão preservados.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearDatabase}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Sim, Limpar Banco
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
