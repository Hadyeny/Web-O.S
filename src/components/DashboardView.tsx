import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  AlertCircle,
  Wrench,
  Clock,
  MapPin,
  Plus,
  RotateCcw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { DashboardStats, ServiceOrder } from '../types';
import { isExternalOrder } from '../utils/orderUtils';
import { AttentionPanel } from './AttentionPanel';
import { RecentOrdersTable } from './RecentOrdersTable';

export type DashboardFilterId =
  | 'total'
  | 'abertas'
  | 'emAndamento'
  | 'aguardando'
  | 'externo'
  | null;

interface DashboardViewProps {
  stats: DashboardStats;
  orders: ServiceOrder[];
  userName?: string;
  onSelectOrder: (os: ServiceOrder) => void;
  onOpenNewOrder: () => void;
  onViewAllOrders: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  orders,
  userName,
  onSelectOrder,
  onOpenNewOrder,
  onViewAllOrders,
}) => {
  // REQUISITO 1: Estado ativo do filtro para controlar qual dos 5 cards está selecionado
  const [activeFilter, setActiveFilter] = useState<DashboardFilterId>(null);

  // Cálculos dinâmicos e resilientes de contagem para cada um dos 5 cards
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
      ? orders.filter(
          (os) => os.status === 'Aguardando Cliente' || os.status === 'Aguardando Peças'
        ).length
      : stats.aguardandoCliente;
  const externoCount =
    orders.length > 0
      ? orders.filter(isExternalOrder).length
      : stats.atendExterno ?? orders.filter(isExternalOrder).length;

  // Definição dos 5 Cards da Linha Superior
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
      labelName: 'Todas as Ordens',
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
      labelName: 'Abertas / aguardando início',
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
      labelName: 'Em Andamento / em execução',
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
      labelName: 'Aguarda Cliente',
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
      labelName: 'Atend. Externo / criado na empresa',
    },
  ];

  // REQUISITO 1 & 3: Lógica de clique nos cards
  // 1. Se o card "Total de OS geral" for clicado: funciona estritamente como "Limpar Filtros" (reseta para null)
  // 2. Se o card já ativo for clicado novamente: reseta para null (limpando o filtro)
  // 3. Se um card inativo for clicado: ativa seu filtro imediatamente
  const handleCardClick = (cardId: 'total' | 'abertas' | 'emAndamento' | 'aguardando' | 'externo') => {
    if (cardId === 'total') {
      setActiveFilter(null);
      return;
    }

    if (activeFilter === cardId) {
      setActiveFilter(null);
    } else {
      setActiveFilter(cardId);
    }
  };

  // Filtragem da lista de ordens recentes com base no card ativo
  const filteredRecentOrders = useMemo(() => {
    if (!activeFilter || activeFilter === 'total') {
      // Estado padrão original: as mais recentes criadas
      return orders;
    }

    switch (activeFilter) {
      case 'abertas':
        return orders.filter((os) => os.status === 'Aberta');
      case 'emAndamento':
        return orders.filter((os) => os.status === 'Em Andamento');
      case 'aguardando':
        return orders.filter(
          (os) => os.status === 'Aguardando Cliente' || os.status === 'Aguardando Peças'
        );
      case 'externo':
        // Quinto card tratado explicitamente
        return orders.filter(isExternalOrder);
      default:
        return orders;
    }
  }, [orders, activeFilter]);

  const activeFilterMeta = cards.find((c) => c.id === activeFilter);
  const isAnyFilterActive = activeFilter !== null;

  return (
    <div className="space-y-6">
      {/* Top Header / Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{userName ? `Olá, ${userName} !` : 'Painel Geral'}</span>
              {userName && <span className="text-2xl">👋</span>}
            </h1>
            {isAnyFilterActive && (
              <button
                onClick={() => setActiveFilter(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                title="Limpar filtro ativo"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Filtro: {activeFilterMeta?.title} (Limpar)</span>
              </button>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400 capitalize mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: '2-digit',
            })}
          </p>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition transform active:scale-95 text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova OS</span>
        </button>
      </div>

      {/* REQUISITOS 1, 2 E 3: OS 5 CARDS CLICÁVEIS NA LINHA SUPERIOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilter === card.id;

          // REQUISITO 1:
          // Destaque visual imediato no card ativo.
          // Os outros 4 cards não selecionados recebem 'opacity-50 blur-[0.5px] transition-all'.
          // Se nenhum filtro estiver ativo, todos mantêm opacidade normal sem blur.
          let filterClass = 'transition-all duration-300';
          if (isAnyFilterActive) {
            if (isSelected) {
              filterClass =
                'opacity-100 ring-4 shadow-2xl z-10 scale-[1.01] transition-all duration-300';
            } else {
              filterClass =
                'opacity-50 blur-[0.5px] transition-all hover:opacity-80 hover:blur-none';
            }
          }

          return (
            <motion.div
              key={card.id}
              id={`card-filter-${card.id}`}
              // REQUISITO 2: Microinterações com a biblioteca 'motion'
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(card.id)}
              className={`cursor-pointer text-left bg-gradient-to-br ${card.gradient} text-white p-5 rounded-2xl shadow-xl ${card.shadow} relative overflow-hidden group select-none ${filterClass} ${
                isSelected ? card.activeRing : ''
              }`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${card.title} - ${card.sub}: ${card.value} ordens`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(card.id);
                }
              }}
            >
              {/* Marca d'água de fundo */}
              <Icon
                className={`absolute -right-3 -bottom-3 w-28 h-28 ${card.watermarkColor} group-hover:scale-110 transition duration-300 pointer-events-none`}
              />

              {/* Linha superior do card: ícone e indicador */}
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

                {card.isResetCard && isAnyFilterActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/40 text-[10px] font-bold text-blue-100 border border-blue-300/30">
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Limpar</span>
                  </span>
                )}
              </div>

              {/* Valor numérico */}
              <div className="text-3xl font-black tracking-tight mb-1 relative z-10">
                {card.value}
              </div>

              {/* Título & Subtítulo */}
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

      {/* Grid Principal: Atenção à Esquerda + Ordens Recentes Filtradas à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px]">
        {/* Painel Esquerdo: Chamados Estagnados / Atenção */}
        <div className="lg:col-span-4">
          <AttentionPanel
            stalledOrders={stats.stalledOrders}
            onSelectOrder={onSelectOrder}
          />
        </div>

        {/* Painel Direito: Ordens Recentes (Controladas pelo Filtro do Topo) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter || 'all'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <RecentOrdersTable
                orders={filteredRecentOrders}
                onSelectOrder={onSelectOrder}
                onViewAll={onViewAllOrders}
                activeFilterLabel={activeFilterMeta ? activeFilterMeta.labelName : null}
                onClearFilter={() => setActiveFilter(null)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
