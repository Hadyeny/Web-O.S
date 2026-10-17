import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ServiceOrder } from '../types';

async function fetchOrders(status?: string): Promise<ServiceOrder[]> {
  const url = status && status !== 'all' ? `/api/service-orders?status=${encodeURIComponent(status)}` : '/api/service-orders';
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao carregar ordens de serviço');
  return res.json();
}

export function useServiceOrders(statusFilter?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['service-orders', statusFilter],
    queryFn: () => fetchOrders(statusFilter),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (newOS: Partial<ServiceOrder>) => {
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newOS),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar ordem de serviço');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`OS ${data.id} criada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao criar OS');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ServiceOrder> }) => {
      const res = await fetch(`/api/service-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar ordem de serviço');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`OS ${data.id} atualizada.`);
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao atualizar OS');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/service-orders/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao excluir ordem de serviço');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('OS excluída com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao excluir OS');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ osId, content }: { osId: string; content: string }) => {
      const res = await fetch(`/api/service-orders/${osId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Falha ao adicionar nota à OS');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Nota adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao adicionar nota');
    },
  });

  return {
    orders: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createOrder: createMutation.mutateAsync,
    updateOrder: updateMutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
    addNote: addNoteMutation.mutateAsync,
  };
}
