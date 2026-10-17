import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User } from '../types';

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users', { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao carregar usuários');
  return res.json();
}

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 60000,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { password?: string }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar usuário');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Usuário ${data.name} criado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao criar usuário');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> & { password?: string } }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar usuário');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Usuário ${data.name} atualizado!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao atualizar usuário');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}/toggle-status`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Falha ao alterar status do usuário');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Status do usuário ${data.name} atualizado!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao alternar status');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao excluir usuário');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Usuário excluído.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao excluir usuário');
    },
  });

  return {
    users: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createUser: createUserMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    toggleUserStatus: toggleStatusMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
  };
}
