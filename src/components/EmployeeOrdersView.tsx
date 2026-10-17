import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Monitor,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { ServiceOrder } from '../types';

interface EmployeeOrdersViewProps {
  orders: ServiceOrder[];
  userName: string;
  onOpenNewOrder: () => void;
  onSelectOrder: (os: ServiceOrder) => void;
}

export const EmployeeOrdersView: React.FC<EmployeeOrdersViewProps> = ({
  orders,
  userName,
  onOpenNewOrder,
  onSelectOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter((os) => {
    if (statusFilter !== 'all' && os.status !== statusFilter) return false;
    if (
      searchTerm &&
      !os.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !os.equipment.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !os.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const pendingCount = orders.filter(
    (o) => o.status === 'Aberta' || o.status === 'Em Andamento' || o.status === 'Aguardando Peças'
  ).length;
  const completedCount = orders.filter(
    (o) => o.status === 'Finalizado' || o.status === 'Encerrado'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header do Funcionário */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-700/50">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Portal do Colaborador
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Meus Chamados & Suporte de TI
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 font-medium">
              Olá, {userName}. Acompanhe em tempo real as manutenções e chamados técnicos de seus equipamentos.
            </p>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="bg-white hover:bg-blue-50 text-blue-900 font-extrabold px-5 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-blue-700" />
            <span>Abrir Novo Chamado</span>
          </button>
        </div>

        {/* Resumo rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-blue-800/60">
          <div className="bg-blue-950/40 rounded-2xl p-3 border border-blue-700/40">
            <span className="text-[11px] text-blue-300 font-semibold block">Chamados Abertos</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{pendingCount}</span>
          </div>

          <div className="bg-blue-950/40 rounded-2xl p-3 border border-blue-700/40">
            <span className="text-[11px] text-emerald-300 font-semibold block">Resolvidos</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block">{completedCount}</span>
          </div>

          <div className="bg-blue-950/40 rounded-2xl p-3 border border-blue-700/40 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-blue-300 font-semibold block">Total Registrado</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por equipamento, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {['all', 'Aberta', 'Em Andamento', 'Finalizado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Chamados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Monitor className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Nenhum chamado encontrado</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Não há chamados correspondentes aos filtros atuais. Se precisar de assistência técnica ou manutenção em seu computador ou sistema, clique no botão acima para abrir uma nova solicitação.
            </p>
          </div>
        ) : (
          filteredOrders.map((os) => (
            <div
              key={os.id}
              onClick={() => onSelectOrder(os)}
              className="p-4 sm:p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                    {os.id}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    {os.equipment}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    • {os.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {os.description}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    {os.notes?.length || 0} notas técnicas
                  </span>
                  {os.technicianName && (
                    <span className="text-slate-700 font-semibold">
                      Técnico: {os.technicianName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    os.status === 'Finalizado'
                      ? 'bg-emerald-100 text-emerald-800'
                      : os.status === 'Em Andamento'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {os.status}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Prioridade: <strong className="text-slate-700">{os.priority}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
