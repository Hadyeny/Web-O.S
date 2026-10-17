import React from 'react';
import { Shield, ShieldAlert, User as UserIcon, Clock, FileText, Lock } from 'lucide-react';
import { AuditLog, User } from '../types';

interface AuditLogsViewProps {
  logs: AuditLog[];
  currentUser?: User;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, currentUser }) => {
  // REQUISITO 1: PRIVACIDADE DOS LOGS
  // Bloqueie a renderização se o usuário não for superadmin.
  const roleUpper = (currentUser?.role || '').trim().toUpperCase();
  const isSuperAdmin = roleUpper === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-lg mx-auto my-12">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">Acesso Restrito (HTTP 403)</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          A visualização dos Logs do Sistema (Audit Log) é de acesso <strong>estritamente restrito e confidencial</strong>, disponível exclusivamente para usuários com papel <strong>SUPER_ADMIN</strong>.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 py-2 px-4 rounded-xl border border-rose-100">
          <Lock className="w-3.5 h-3.5" />
          Perfil atual: {currentUser?.role || 'Não identificado'} — Não autorizado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            Rastreabilidade e Segurança (Audit Log)
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mt-1">Logs de Alterações do Sistema</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico corporativo restrito ao Super Administrador. Registros de login de Super Admin são omitidos por política de segurança.
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs">
          {logs.length} Registros
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Papel</th>
                <th className="py-3.5 px-4">Ação</th>
                <th className="py-3.5 px-4">Alvo</th>
                <th className="py-3.5 px-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Nenhum log de alteração registrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const logRole = (log.userRole || '').toUpperCase();
                  const roleBadgeClass =
                    logRole === 'SUPER_ADMIN'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : logRole === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-semibold text-slate-500 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString()} {' '}
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>{log.userName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadgeClass}`}
                        >
                          {log.userRole}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-indigo-600">
                        {log.action}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.targetId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
