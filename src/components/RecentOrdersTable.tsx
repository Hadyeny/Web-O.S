import React from 'react';
import { TrendingUp, ArrowRight, ChevronRight, Filter, X, RotateCcw } from 'lucide-react';
import { ServiceOrder } from '../types';

interface RecentOrdersTableProps {
  orders: ServiceOrder[];
  onSelectOrder: (os: ServiceOrder) => void;
  onViewAll: () => void;
  activeFilterLabel?: string | null;
  onClearFilter?: () => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  onSelectOrder,
  onViewAll,
  activeFilterLabel,
  onClearFilter,
}) => {
  const displayOrders = orders.slice(0, 8);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Encerrado':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Em Andamento':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Aguardando Peças':
      case 'Aguardando Cliente':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Aberta':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const created = new Date(dateStr).getTime();
    const diffHours = Math.floor((Date.now() - created) / (3600 * 1000));
    if (diffHours < 1) return 'agora há pouco';
    if (diffHours < 24) return 'hoje';
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-800 text-sm">
            {activeFilterLabel ? 'Ordens Filtradas' : 'Ordens Recentes'}
          </h2>

          {activeFilterLabel && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold animate-in fade-in">
              <Filter className="w-3 h-3" />
              <span>{activeFilterLabel}</span>
              <span className="text-[10px] font-normal text-blue-500">({orders.length})</span>
              {onClearFilter && (
                <button
                  onClick={onClearFilter}
                  title="Limpar filtro e voltar para todas as ordens"
                  className="ml-1 hover:bg-blue-200/60 p-0.5 rounded-full transition"
                >
                  <X className="w-3 h-3 text-blue-700" />
                </button>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {activeFilterLabel && onClearFilter && (
            <button
              onClick={onClearFilter}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar padrão</span>
            </button>
          )}

          <button
            onClick={onViewAll}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
        {displayOrders.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
              <Filter className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              {activeFilterLabel
                ? `Nenhum chamado com o filtro "${activeFilterLabel}"`
                : 'Nenhuma ordem de serviço cadastrada.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              {activeFilterLabel && onClearFilter ? (
                <span>
                  Clique no card{' '}
                  <button
                    onClick={onClearFilter}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    "Total de OS geral"
                  </button>{' '}
                  para restaurar a lista padrão.
                </span>
              ) : (
                'Novas ordens criadas aparecerão automaticamente aqui.'
              )}
            </p>
          </div>
        ) : (
          displayOrders.map((os) => (
            <div
              key={os.id}
              onClick={() => onSelectOrder(os)}
              className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-xl transition cursor-pointer group"
            >
              {/* Code */}
              <div className="w-20 font-extrabold text-xs text-blue-600 group-hover:underline shrink-0">
                {os.id}
              </div>

              {/* Client & Equipment */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-slate-800 truncate">{os.clientName}</div>
                <div className="text-[11px] text-slate-400 font-medium truncate">
                  {os.equipment}
                  {os.category && (
                    <span className="ml-1.5 text-[10px] text-slate-400 font-normal">
                      • {os.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(
                    os.status
                  )}`}
                >
                  {os.status}
                </span>
              </div>

              {/* Relative time */}
              <div className="text-[11px] text-slate-400 font-medium shrink-0 w-20 text-right">
                {getRelativeTime(os.createdAt)}
              </div>

              {/* Action Arrow */}
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
