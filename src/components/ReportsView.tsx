import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  RefreshCw,
  FileSpreadsheet,
  Tag,
  Inbox,
  BarChart3,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { User, ServiceOrder, DashboardStats } from '../types';
import { API_ROUTES } from '../constants/apiRoutes';

export interface ProductivityReportRow {
  tecnico_id: number | string;
  tecnico_nome: string;
  tecnico_email: string;
  total_atribuidas: number;
  resolvidas: number;
  abertas_em_andamento: number;
  tempo_medio_resolucao_horas: number;
}

export interface ReportsViewProps {
  currentUser: User;
  users?: User[];
  onSelectOrder?: (os: ServiceOrder) => void;
}

type PeriodShortcut = 'esta_semana' | 'este_mes' | 'ultimos_30' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  users: initialUsers = [],
  onSelectOrder,
}) => {
  // Helper para formatar data em formato de input ISO YYYY-MM-DD
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper para formatar data no padrão brasileiro DD/MM/AAAA
  const formatDateBR = (dateStr: string): string => {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Funções geradoras dos intervalos de atalho rápido
  const getWeekRange = (): { start: string; end: string } => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Domingo, 1: Segunda ...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: formatDateForInput(monday),
      end: formatDateForInput(sunday),
    };
  };

  const getMonthRange = (): { start: string; end: string } => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDateForInput(firstDay),
      end: formatDateForInput(lastDay),
    };
  };

  const getLast30DaysRange = (): { start: string; end: string } => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    return {
      start: formatDateForInput(thirtyDaysAgo),
      end: formatDateForInput(now),
    };
  };

  // Estado padrão inicial: "Este Mês"
  const defaultMonth = getMonthRange();
  const [dataInicio, setDataInicio] = useState<string>(defaultMonth.start);
  const [dataFim, setDataFim] = useState<string>(defaultMonth.end);
  const [activeShortcut, setActiveShortcut] = useState<PeriodShortcut>('este_mes');

  // Filtros cumulativos
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Lista de técnicos disponíveis (para o select)
  const [techniciansList, setTechniciansList] = useState<User[]>(initialUsers);

  // Estados dos dados e interface
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [reportData, setReportData] = useState<ProductivityReportRow[]>([]);
  const [periodOrders, setPeriodOrders] = useState<ServiceOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'productivity'>('orders');

  const roleUpper = (currentUser.role || '').toUpperCase();
  const hasAccess = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';

  // Categorias padrão corporativas de TI
  const categoriesList = useMemo(
    () => [
      'Hardware',
      'Rede',
      'Servidores',
      'Sistemas',
      'Impressoras',
      'Acesso & Segurança',
      'Infraestrutura',
      'Outro',
    ],
    []
  );

  // Carrega lista de técnicos se não tiver sido injetada via props
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      const filtered = initialUsers.filter((u) => {
        const r = (u.role || '').toUpperCase();
        return r === 'TECNICO' || r === 'TECHNICIAN' || r === 'ADMIN';
      });
      setTechniciansList(filtered);
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch(API_ROUTES.users, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const list: User[] = await res.json();
          const techs = list.filter((u) => {
            const r = (u.role || '').toUpperCase();
            return r === 'TECNICO' || r === 'TECHNICIAN' || r === 'ADMIN';
          });
          setTechniciansList(techs);
        }
      } catch (err) {
        console.warn('[REPORTS VIEW] Erro ao carregar técnicos:', err);
      }
    };
    fetchUsers();
  }, [initialUsers]);

  // Consulta da API com parâmetros de período
  const fetchData = useCallback(
    async (
      startDate: string = dataInicio,
      endDate: string = dataFim,
      techId: string = selectedTech,
      category: string = selectedCategory
    ) => {
      if (!hasAccess) return;

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('dataInicio', startDate);
        if (endDate) queryParams.append('dataFim', endDate);
        if (techId && techId.trim() !== '') queryParams.append('tecnicoId', techId);
        if (category && category.trim() !== '') queryParams.append('categoria', category);

        const statsUrl = `${API_ROUTES.dashboardStats}?${queryParams.toString()}`;
        const productivityUrl = `${API_ROUTES.reportsProductivity}?data_inicio=${encodeURIComponent(
          startDate
        )}&data_fim=${encodeURIComponent(endDate)}`;
        const ordersUrl = `${API_ROUTES.serviceOrders}${
          techId && techId.trim() !== '' ? `?techId=${encodeURIComponent(techId)}` : ''
        }`;

        const [resStats, resProd, resOrders] = await Promise.all([
          fetch(statsUrl, { credentials: 'include', headers: { 'Content-Type': 'application/json' } }),
          fetch(productivityUrl, { credentials: 'include', headers: { 'Content-Type': 'application/json' } }),
          fetch(ordersUrl, { credentials: 'include', headers: { 'Content-Type': 'application/json' } }),
        ]);

        if (!resStats.ok && resStats.status === 403) {
          throw new Error('Acesso restrito. Apenas administradores podem visualizar este relatório.');
        }

        if (resStats.ok) {
          const statsJson = await resStats.json();
          setStatsData(statsJson);
        }

        if (resProd.ok) {
          const prodJson = await resProd.json();
          const rows: ProductivityReportRow[] = Array.isArray(prodJson) ? prodJson : prodJson.data || [];
          const filteredRows = techId
            ? rows.filter(
                (r) =>
                  String(r.tecnico_id) === String(techId) ||
                  (r.tecnico_nome && r.tecnico_nome.toLowerCase() === techId.toLowerCase())
              )
            : rows;
          setReportData(filteredRows);
        }

        if (resOrders.ok) {
          const ordersJson: ServiceOrder[] = await resOrders.json();
          const startTs = new Date(`${startDate}T00:00:00.000Z`).getTime();
          const endTs = new Date(`${endDate}T23:59:59.999Z`).getTime();

          const filtered = ordersJson.filter((os) => {
            const createdTs = new Date(os.createdAt).getTime();
            const inDateRange =
              (!isNaN(startTs) ? createdTs >= startTs : true) &&
              (!isNaN(endTs) ? createdTs <= endTs : true);

            const matchTech =
              !techId ||
              techId === '' ||
              String(os.technicianId) === String(techId) ||
              (os.technicianName && os.technicianName.toLowerCase() === techId.toLowerCase());

            const matchCategory =
              !category ||
              category === '' ||
              (os.category && os.category.toLowerCase() === category.toLowerCase());

            return inDateRange && matchTech && matchCategory;
          });

          setPeriodOrders(filtered);
        }
      } catch (err: any) {
        console.error('[REPORTS PERIODIC ERROR]:', err);
        setError(err.message || 'Erro ao consultar indicadores do período.');
      } finally {
        setLoading(false);
      }
    },
    [dataInicio, dataFim, selectedTech, selectedCategory, hasAccess]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers dos botões de atalho rápido
  const handleShortcutSelect = (shortcut: 'esta_semana' | 'este_mes' | 'ultimos_30') => {
    setActiveShortcut(shortcut);

    let range: { start: string; end: string };
    if (shortcut === 'esta_semana') {
      range = getWeekRange();
    } else if (shortcut === 'este_mes') {
      range = getMonthRange();
    } else {
      range = getLast30DaysRange();
    }

    setDataInicio(range.start);
    setDataFim(range.end);
    fetchData(range.start, range.end, selectedTech, selectedCategory);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(dataInicio, dataFim, selectedTech, selectedCategory);
  };

  const handleClearFilters = () => {
    const defaultM = getMonthRange();
    setDataInicio(defaultM.start);
    setDataFim(defaultM.end);
    setActiveShortcut('este_mes');
    setSelectedTech('');
    setSelectedCategory('');
    fetchData(defaultM.start, defaultM.end, '', '');
  };

  // Helper para formatação de data e hora com fuso de Brasília (America/Sao_Paulo)
  const formatDateTime = (isoString?: string): string => {
    if (!isoString) return '--/--/---- --:--';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '--/--/---- --:--';
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Data e hora de emissão atualizada no fuso de São Paulo
  const getEmissionDateTime = (): string => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());
    } catch {
      return new Date().toLocaleString('pt-BR');
    }
  };

  // Ação de Impressão Física Nativa
  const handlePrint = () => {
    // Garante que a tabela unificada esteja ativa antes da impressão
    if (activeTab !== 'orders') {
      setActiveTab('orders');
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  // Badge de Status do Chamado
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
    let Icon = Inbox;

    if (s.includes('FINALIZADO') || s.includes('ENCERRADO') || s.includes('RESOLVIDO')) {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
    } else if (s.includes('ANDAMENTO')) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
    } else if (s.includes('PEÇAS') || s.includes('TERCEIRO') || s.includes('CLIENTE')) {
      badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
      Icon = AlertCircle;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass} status-badge-print`}
      >
        <Icon className="w-3 h-3 print:hidden shrink-0" />
        <span>{status}</span>
      </span>
    );
  };

  // Helper para coluna concisa de Serviço / Ativo (sem quebrar margens)
  const getServiceAsset = (os: ServiceOrder): string => {
    const eq = os.equipment?.trim();
    const cat = os.category?.trim();
    if (eq && cat) {
      return `${eq} • ${cat}`;
    }
    return eq || cat || 'Atendimento Geral de TI';
  };

  // 1. ALGORITMO DE ORDENAÇÃO DE STRING NUMÉRICA DEFENSIVO:
  // Como o ID da O.S. pode conter letras e traços (Ex: 'OS-001'), limpa a string
  // extraindo apenas os dígitos com .replace(/\D/g, '') e faz o cast para parseInt(..., 10).
  // Ordena de forma crescente (numA - numB), garantindo que a O.S. de menor número seja listada no topo.
  const sortedPeriodOrders = useMemo(() => {
    return [...periodOrders].sort((a, b) => {
      const numA = parseInt(String(a.id ?? '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.id ?? '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [periodOrders]);

  // Exportação CSV
  const handleExportCSV = () => {
    if (sortedPeriodOrders.length === 0 && reportData.length === 0) {
      alert('Não há dados disponíveis para exportação no período selecionado.');
      return;
    }

    const headers = [
      'Código OS',
      'Cliente',
      'Serviço / Ativo',
      'Categoria',
      'Técnico Responsável',
      'Status',
      'Criado Em',
    ];

    const rows = sortedPeriodOrders.map((os) => [
      os.id,
      `"${(os.clientName || '').replace(/"/g, '""')}"`,
      `"${(os.equipment || '').replace(/"/g, '""')}"`,
      `"${(os.category || '').replace(/"/g, '""')}"`,
      `"${(os.technicianName || 'Não Atribuído').replace(/"/g, '""')}"`,
      os.status,
      formatDateTime(os.createdAt),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const fileName = `relatorio_gerencial_ti_${dataInicio}_a_${dataFim}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cálculos consolidados para os cards KPI do período
  const totalOSCount = periodOrders.length > 0 ? periodOrders.length : statsData?.totalOS || 0;
  const resolvidasCount =
    periodOrders.length > 0
      ? periodOrders.filter((os) => os.status === 'Finalizado' || os.status === 'Encerrado').length
      : statsData?.finalizadas || 0;
  const emAndamentoCount =
    periodOrders.length > 0
      ? periodOrders.filter((os) => os.status === 'Em Andamento' || os.status === 'Aberta').length
      : (statsData?.abertas || 0) + (statsData?.emAndamento || 0);
  const aguardandoCount =
    periodOrders.length > 0
      ? periodOrders.filter(
          (os) => os.status === 'Aguardando Cliente' || os.status === 'Aguardando Peças'
        ).length
      : statsData?.aguardandoCliente || 0;

  const taxaResolucao =
    totalOSCount > 0 ? Math.round((resolvidasCount / totalOSCount) * 100) : 0;

  if (!hasAccess) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-12 text-center shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Acesso Restrito a Administradores</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Esta tela de relatórios gerenciais é reservada exclusivamente para usuários com as funções
          de Administrador ou Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* ESTILOS DE IMPRESSÃO FÍSICA OTIMIZADOS PARA FOLHA A4 (@media print)         */}
      {/* ========================================================================= */}
      <style>{`
        @media print {
          /* 1. Ocultação estrita dos elementos irrelevantes na folha impressa */
          aside,
          header,
          nav,
          .no-print,
          .btn-export-csv,
          .report-filters-bar,
          .kpi-cards-grid,
          .subtabs-navigation {
            display: none !important;
          }

          /* 2. Configurações de dimensão e margens para folha A4 */
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 15mm 10mm;
          }

          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 9pt !important;
            line-height: 1.3 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Reset de layout e espaçamento para ocupar a folha A4 com perfeição */
          .min-h-screen,
          div[class*="min-h-screen"],
          .flex-1 {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
          }

          /* Remove sombras e transbordamentos de containers */
          div {
            overflow: visible !important;
            box-shadow: none !important;
          }

          .print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          /* 3. Cabeçalho Timbrado Corporativo */
          .print-header {
            display: block !important;
            margin-bottom: 16px !important;
            padding-bottom: 12px !important;
            border-bottom: 2px solid #0f172a !important;
          }

          .print-footer {
            display: flex !important;
          }

          /* 4. Tabela Unificada de Relatório limpa e de 4 colunas */
          .unified-report-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin-top: 8px !important;
          }

          .unified-report-table thead {
            display: table-header-group !important;
          }

          /* 5. Blindagem contra corte horizontal de linhas (page-break-inside: avoid) */
          .unified-report-table tr,
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .unified-report-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-size: 8.5pt !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            padding: 7px 8px !important;
            border-top: 1px solid #94a3b8 !important;
            border-bottom: 2px solid #0f172a !important;
            text-align: left !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .unified-report-table td {
            padding: 7px 8px !important;
            font-size: 8.5pt !important;
            color: #1e293b !important;
            border-bottom: 1px solid #cbd5e1 !important;
            vertical-align: middle !important;
          }

          .status-badge-print {
            border: 1px solid #94a3b8 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-weight: 700 !important;
            font-size: 7.5pt !important;
            display: inline-block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* CABEÇALHO TIMBRADO CORPORATIVO (EXCLUSIVO PARA IMPRESSÃO FÍSICA A4)       */}
      {/* ========================================================================= */}
      <div className="print-header hidden pb-4 mb-4 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                P
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                PLIOOU • TECNOLOGIA & GESTÃO
              </span>
            </div>
            <p className="text-[11pt] font-extrabold text-slate-800 tracking-wide uppercase">
              Relatório Gerencial de Ordens de Serviço
            </p>
            <p className="text-[8.5pt] text-slate-500">
              Documento oficial consolidado para controle operacional e histórico de chamados
            </p>
          </div>

          <div className="text-right text-[8.5pt] text-slate-700 space-y-1 min-w-[220px]">
            <div>
              <strong className="text-slate-900">Data de Emissão:</strong>{' '}
              <span>{getEmissionDateTime()}</span>
            </div>
            <div>
              <strong className="text-slate-900">Período Selecionado:</strong>{' '}
              <span>
                {formatDateBR(dataInicio)} até {formatDateBR(dataFim)}
              </span>
            </div>
            {selectedTech && (
              <div>
                <strong className="text-slate-900">Técnico Filtrado:</strong>{' '}
                <span>
                  {techniciansList.find((t) => String(t.id) === String(selectedTech))?.name ||
                    selectedTech}
                </span>
              </div>
            )}
            {selectedCategory && (
              <div>
                <strong className="text-slate-900">Categoria:</strong>{' '}
                <span>{selectedCategory}</span>
              </div>
            )}
            <div>
              <strong className="text-slate-900">Total de Registros:</strong>{' '}
              <span className="font-bold text-slate-900">{periodOrders.length} chamados</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CABEÇALHO DE TELA (Ocultado na impressão via .no-print)                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            Painel Corporativo & Métricas Estratégicas
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mt-1">
            Relatórios e Indicadores Gerenciais de TI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise periódica consolidada, acompanhamento de SLA e impressão física padronizada.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Botão IMPRIMIR RELATÓRIO vinculado a window.print() */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || periodOrders.length === 0}
            className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition shrink-0 ${
              loading || periodOrders.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25 active:scale-95'
            }`}
            title="Imprimir relatório físico formatado para folhas A4"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR RELATÓRIO</span>
          </button>

          {/* Botão Exportar CSV */}
          <button
            onClick={handleExportCSV}
            disabled={loading || (periodOrders.length === 0 && reportData.length === 0)}
            className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition shrink-0 btn-export-csv ${
              loading || (periodOrders.length === 0 && reportData.length === 0)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-95'
            }`}
            title="Exportar os chamados do período para arquivo CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => fetchData(dataInicio, dataFim, selectedTech, selectedCategory)}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
            title="Atualizar dados do período"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR DE FILTROS PERIÓDICOS (Ocultada na impressão via .no-print) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 no-print report-filters-bar">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            {/* Inputs emparelhados de Data Inicial e Data Final */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    setActiveShortcut('custom');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Data Final
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => {
                    setDataFim(e.target.value);
                    setActiveShortcut('custom');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Atalhos Rápidos de Período (Pills) */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Atalhos de Período
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleShortcutSelect('esta_semana')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeShortcut === 'esta_semana'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600 ring-offset-1'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>Esta Semana</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShortcutSelect('este_mes')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeShortcut === 'este_mes'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600 ring-offset-1'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>Este Mês</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShortcutSelect('ultimos_30')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeShortcut === 'ultimos_30'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600 ring-offset-1'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>Últimos 30 Dias</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selects cumulativos de Técnico e Categoria */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Filtrar por Técnico
                </label>
                <select
                  value={selectedTech}
                  onChange={(e) => {
                    const newTech = e.target.value;
                    setSelectedTech(newTech);
                    fetchData(dataInicio, dataFim, newTech, selectedCategory);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                >
                  <option value="">Todos os Técnicos</option>
                  {techniciansList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  Filtrar por Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSelectedCategory(newCat);
                    fetchData(dataInicio, dataFim, selectedTech, newCat);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                >
                  <option value="">Todas as Categorias</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(selectedTech !== '' || selectedCategory !== '' || activeShortcut === 'custom') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  title="Restaurar filtros padrões"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition active:scale-95"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                <span>Filtrar</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5 shadow-sm no-print">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CARDS KPI DE INDICADORES DO PERÍODO (Ocultados na impressão)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print kpi-cards-grid">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total no Período
            </p>
            <p className="text-lg font-black text-slate-800">{totalOSCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Resolvidos ({taxaResolucao}%)
            </p>
            <p className="text-lg font-black text-slate-800">{resolvidasCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Em Andamento / Abertos
            </p>
            <p className="text-lg font-black text-slate-800">{emAndamentoCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Aguardando Resposta/Peça
            </p>
            <p className="text-lg font-black text-slate-800">{aguardandoCount}</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-NAVEGAÇÃO (Ocultada na impressão via .no-print)                        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print subtabs-navigation">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tabela Unificada de Chamados</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'orders' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {periodOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('productivity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'productivity'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Produtividade dos Técnicos</span>
          {reportData.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'productivity' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {reportData.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TABELA UNIFICADA DE RELATÓRIO (4 COLUNAS ESSENCIAIS)                      */}
      {/* Focada em: Código O.S., Nome do Cliente, Serviço/Ativo e Status           */}
      {/* Removidas distrações visuais longas e com suporte a quebra de página      */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200 print-container">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 no-print">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Chamados Registrados no Período Selecionado
              </h3>
              <p className="text-[11px] text-slate-500">
                Exibindo de {formatDateBR(dataInicio)} até {formatDateBR(dataFim)}
                {selectedTech ? ` • Técnico ID: ${selectedTech}` : ''}
                {selectedCategory ? ` • Categoria: ${selectedCategory}` : ''}
              </p>
            </div>

            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
              {periodOrders.length} O.S. Localizadas
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3 no-print">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Buscando chamados do período...</p>
            </div>
          ) : periodOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto no-print">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Nenhum chamado no período</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não foram encontrados chamados com os filtros de data, técnico ou categoria selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed unified-report-table">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-[15%]">Código O.S.</th>
                    <th className="py-3.5 px-4 w-[32%]">Nome do Cliente</th>
                    <th className="py-3.5 px-4 w-[35%]">Serviço / Ativo</th>
                    <th className="py-3.5 px-4 w-[18%] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Renderização em ordem cronológica crescente pelo ID numérico da O.S. */}
                  {sortedPeriodOrders.map((os) => {
                    const serviceAsset = getServiceAsset(os);
                    return (
                      <tr
                        key={os.id}
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                        onClick={() => onSelectOrder && onSelectOrder(os)}
                        className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                      >
                        {/* 1. Código da O.S. */}
                        <td className="py-3 px-4 font-extrabold text-blue-600 group-hover:underline font-mono text-xs">
                          #{os.id}
                        </td>

                        {/* 2. Nome do Cliente */}
                        <td className="py-3 px-4 min-w-0">
                          <p
                            className="font-bold text-slate-800 text-xs truncate"
                            title={os.clientName || 'Cliente Geral'}
                          >
                            {os.clientName || 'Cliente Geral'}
                          </p>
                        </td>

                        {/* 3. Serviço / Ativo (equipment / category conciso) */}
                        <td className="py-3 px-4 min-w-0">
                          <p
                            className="font-semibold text-slate-700 text-xs truncate"
                            title={serviceAsset}
                          >
                            {serviceAsset}
                          </p>
                        </td>

                        {/* 4. Status */}
                        <td className="py-3 px-4 text-center shrink-0">
                          {getStatusBadge(os.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé da Impressão Física */}
          <div className="print-footer hidden justify-between items-center text-[8pt] text-slate-500 pt-3 mt-4 border-t border-slate-300">
            <span>Plioou TI • Documento Gerado pelo Sistema de Gestão</span>
            <span>Total: {periodOrders.length} registros • Folha A4</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA DE PRODUTIVIDADE (Visualização Gerencial na tela)                     */}
      {/* ========================================================================= */}
      {activeTab === 'productivity' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-slate-800">
                Desempenho Individual por Técnico no Período
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDateBR(dataInicio)} até {formatDateBR(dataFim)}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Calculando métricas de produtividade...</p>
            </div>
          ) : reportData.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Nenhum dado analítico encontrado</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não foram localizadas ordens de serviço atribuídas no período e filtros especificados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">Técnico</th>
                    <th className="py-3.5 px-4 text-center">Total Atribuídas</th>
                    <th className="py-3.5 px-4 text-center">Resolvidas</th>
                    <th className="py-3.5 px-4 text-center">Pendentes</th>
                    <th className="py-3.5 px-4 text-center">Tempo Médio</th>
                    <th className="py-3.5 px-6 text-right">Taxa de Conclusão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row) => {
                    const taxa =
                      row.total_atribuidas > 0
                        ? Math.round((row.resolvidas / row.total_atribuidas) * 100)
                        : 0;

                    return (
                      <tr
                        key={row.tecnico_id}
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                              {(row.tecnico_nome || 'T').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs leading-tight">
                                {row.tecnico_nome}
                              </p>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {row.tecnico_email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {row.total_atribuidas}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            {row.resolvidas}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                          <span className="inline-flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full">
                            {row.abertas_em_andamento}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-purple-600" />
                            {Number(row.tempo_medio_resolucao_horas || 0).toFixed(2)}h
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(taxa, 100)}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-700 w-9 text-right">{taxa}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
