import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  AlertCircle,
  Wrench,
  Clock,
  MapPin,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { DashboardStats, ServiceOrder } from '../types';
import { isExternalOrder } from '../utils/orderUtils';

export type DashboardFilterId = 'total' | 'abertas' | 'emAndamento' | 'aguardando' | 'externo' | null;

export interface StatCardsProps {
  stats: DashboardStats;
  orders?: ServiceOrder[];
  activeFilter: DashboardFilterId;
  onFilterChange: (filterId: DashboardFilterId) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  orders = [],
  activeFilter,
  onFilterChange,
}) => {
  // Cálculo dinâmico e resiliente das quantidades com base no array de ordens e no fallback de stats
  const totalCount = orders.length > 0 ? orders.length : stats.totalOS;
  const abertasCount =
    orders.length > 0
      ? orders.filter((os) => os.status === 'Aberta').length
      : stats.abertas;
  const emAndamentoCount =
    orders.length > 0
      ? orders.filter((os) => os.status === 'Em Andamento').length
      : stats.emAndamento;
  const aguardandoCount =
    orders.length > 0
      ? orders.filter((os) => os.status === 'Aguardando Cliente' || os.status === 'Aguardando Peças').length
      : stats.aguardandoCliente;
  const externoCount =
    orders.length > 0
      ? orders.filter(isExternalOrder).length
      : stats.atendExterno ?? orders.filter(isExternalOrder).length;

  // Os 5 cards oficiais do Dashboard Pliioou
  const cards = [
    {
      id: 'total' as const,
      title: 'Total de OS',
      sub: 'geral',
      value: totalCount,
      icon: FileText,
      gradient: 'from-blue-600 to-blue-700',
      shadow: 'shadow-blue-500/25',
      activeRing: 'ring-4 ring-blue-300 ring-offset-2 ring-offset-slate-900/10',
      watermarkColor: 'text-blue-400/20',
      isResetCard: true,
    },
    {
      id: 'abertas' as const,
      title: 'Abertas',
      sub: 'aguardando início',
      value: abertasCount,
      icon: AlertCircle,
      gradient: 'from-orange-500 to-amber-600',
      shadow: 'shadow-orange-500/25',
      activeRing: 'ring-4 ring-orange-300 ring-offset-2 ring-offset-slate-900/10',
      watermarkColor: 'text-orange-400/20',
      isResetCard: false,
    },
    {
      id: 'emAndamento' as const,
      title: 'Em Andamento',
      sub: 'em execução',
      value: emAndamentoCount,
      icon: Wrench,
      gradient: 'from-amber-500 to-yellow-600',
      shadow: 'shadow-amber-500/25',
      activeRing: 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900/10',
      watermarkColor: 'text-yellow-400/20',
      isResetCard: false,
    },
    {
      id: 'aguardando' as const,
      title: 'Aguarda Cliente',
      sub: 'aguardando cliente',
      value: aguardandoCount,
      icon: Clock,
      gradient: 'from-purple-600 to-purple-800',
      shadow: 'shadow-purple-500/25',
      activeRing: 'ring-4 ring-purple-300 ring-offset-2 ring-offset-slate-900/10',
      watermarkColor: 'text-purple-400/20',
      isResetCard: false,
    },
    {
      id: 'externo' as const,
      title: 'Atend. Externo',
      sub: 'criado na empresa',
      value: externoCount,
      icon: MapPin,
      gradient: 'from-slate-900 via-blue-950 to-indigo-950 border border-blue-800/50',
      shadow: 'shadow-slate-900/40',
      activeRing: 'ring-4 ring-indigo-300 ring-offset-2 ring-offset-slate-900/10',
      watermarkColor: 'text-indigo-400/20',
      isResetCard: false,
    },
  ];

  // Regra de clique:
  // - "Total de OS geral": atua estritamente como botão de "Limpar Filtros", resetando o estado para null
  // - Card com filtro ativo clicado novamente: reseta para null (limpando o filtro)
  // - Card inativo clicado: ativa seu filtro específico
  const handleCardClick = (cardId: 'total' | 'abertas' | 'emAndamento' | 'aguardando' | 'externo') => {
    if (cardId === 'total') {
      onFilterChange(null);
      return;
    }

    if (activeFilter === cardId) {
      onFilterChange(null);
    } else {
      onFilterChange(cardId);
    }
  };

  const isFilterActive = activeFilter !== null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        // Regra UX 1:
        // Quando um card for clicado, ele ganha destaque visual imediato.
        // Os outros 4 cards não selecionados recebem 'opacity-50 blur-[0.5px] transition-all'.
        // Se nenhum filtro estiver ativo, todos mantêm opacidade total sem blur.
        let isolationClass = 'transition-all duration-300';
        if (isFilterActive) {
          if (isSelected) {
            isolationClass = 'opacity-100 ring-4 shadow-2xl z-10 scale-[1.01] transition-all duration-300';
          } else {
            isolationClass = 'opacity-50 blur-[0.5px] transition-all hover:opacity-80 hover:blur-none';
          }
        }

        return (
          <motion.div
            key={card.id}
            id={`dashboard-card-${card.id}`}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(card.id)}
            className={`cursor-pointer text-left bg-gradient-to-br ${card.gradient} text-white p-5 rounded-2xl shadow-xl ${card.shadow} relative overflow-hidden group select-none ${isolationClass} ${
              isSelected ? card.activeRing : ''
            }`}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${card.title} - ${card.sub}: ${card.value}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(card.id);
              }
            }}
          >
            {/* Background icon watermark */}
            <Icon className={`absolute -right-3 -bottom-3 w-28 h-28 ${card.watermarkColor} group-hover:scale-110 transition duration-300 pointer-events-none`} />

            {/* Top Row: Icon Pill & Active Badge */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Icon className="w-5 h-5 text-white" />
              </div>

              {isSelected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white border border-white/40 shadow-sm animate-in fade-in duration-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  <span>Filtrando</span>
                </span>
              )}

              {card.isResetCard && isFilterActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/40 text-[10px] font-bold text-blue-100 border border-blue-300/30">
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Limpar</span>
                </span>
              )}
            </div>

            {/* Value */}
            <div className="text-3xl font-black tracking-tight mb-1 relative z-10">
              {card.value}
            </div>

            {/* Title & Sub */}
            <div className="font-bold text-sm leading-tight text-white relative z-10">
              {card.title}
            </div>
            <div className="text-[11px] font-medium text-white/80 relative z-10">
              {card.sub}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
