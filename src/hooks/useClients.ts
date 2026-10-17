import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Client } from '../types';

async function fetchClients(): Promise<Client[]> {
  const res = await fetch('/api/clients', { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao carregar clientes');
  return res.json();
}

export function useClients() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(client),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar cliente');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Cliente ${data.name} cadastrado!`);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao cadastrar cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar cliente');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Cliente ${data.name} atualizado!`);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao atualizar cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao excluir cliente');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Cliente excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao excluir cliente');
    },
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation.mutateAsync,
    deleteClient: deleteMutation.mutateAsync,
  };
}
