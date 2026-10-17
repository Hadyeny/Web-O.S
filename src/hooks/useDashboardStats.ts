import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '../types';

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao carregar estatísticas');
  return res.json();
}

export function useDashboardStats() {
  const query = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchStats,
    staleTime: 15000,
  });

  return {
    stats: query.data || {
      totalOS: 0,
      abertas: 0,
      emAndamento: 0,
      aguardandoCliente: 0,
      finalizadas: 0,
      stalledOrders: [],
      productivity: [],
    },
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
