import React from 'react';
import { BarChart3, Users, CheckCircle2, Clock, ShieldCheck, Wrench, Trash2, Database } from 'lucide-react';
import { DashboardStats, ServiceOrder } from '../types';

interface AdminDashboardProps {
  stats: DashboardStats;
  allOrders: ServiceOrder[];
  onSelectOrder: (os: ServiceOrder) => void;
  onClearDatabase?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  allOrders,
  onSelectOrder,
  onClearDatabase,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Visão Geral de Produtividade & Governança
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Dashboard Administrativo de T.I.</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de desempenho da equipe técnica, volume de chamados e conformidade de SLA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-center">
            <span className="text-xs font-bold text-slate-400 block">Total de Chamados</span>
            <span className="text-xl font-extrabold text-blue-400">{stats.totalOS}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-center">
            <span className="text-xs font-bold text-slate-400 block">Taxa de Resolução</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {stats.totalOS > 0
                ? Math.round((stats.finalizadas / stats.totalOS) * 100)
                : 0}
              %
            </span>
          </div>

          {onClearDatabase && (
            <button
              onClick={onClearDatabase}
              title="Apagar todas as informações e registros do banco de dados"
              className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Limpar Banco</span>
            </button>
          )}
        </div>
      </div>

      {/* Technician Productivity Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Produtividade de Cada Técnico</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {stats.productivity?.length || 0} Técnicos Ativos
          </span>
        </div>

        {(!stats.productivity || stats.productivity.length === 0) ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Nenhum chamado atribuído no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.productivity.map((tech) => {
              const completionRate =
                tech.totalAssigned > 0
                  ? Math.round((tech.completedCount / tech.totalAssigned) * 100)
                  : 0;

              return (
                <div
                  key={tech.technicianId}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-blue-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                        {tech.technicianName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{tech.technicianName}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">Técnico N2/N3</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                      {completionRate}% resolvidos
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Atribuição: {tech.totalAssigned} OS</span>
                      <span>Concluídas: {tech.completedCount}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Em Fila</span>
                        <span className="font-bold text-slate-800">{tech.inProgressCount} chamados</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Média Resol.</span>
                        <span className="font-bold text-slate-800">{tech.avgResolutionHours}h / ticket</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Critical SLA Monitor */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800 text-base">Monitor de Gargalos de Atendimento (SLA)</h3>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {stats.stalledOrders?.length || 0} Paradas &gt; 48h
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {(!stats.stalledOrders || stats.stalledOrders.length === 0) ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhuma ordem de serviço parada. O SLA está 100% em dia.
            </div>
          ) : (
            stats.stalledOrders.map((os) => (
              <div
                key={os.id}
                onClick={() => onSelectOrder(os)}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    {os.id}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{os.clientName}</h4>
                    <p className="text-[11px] text-slate-500">{os.equipment}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-600 font-semibold">
                    Técnico: <strong className="text-slate-800">{os.technicianName || 'Não atribuído'}</strong>
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full">
                    {os.stalledHours}h sem ação
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
