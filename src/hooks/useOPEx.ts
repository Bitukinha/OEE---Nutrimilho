/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OPEX {
  id: string;
  departamento: string;
  descricao: string;
  data_inicio: string;
  data_prevista_termino: string;
  status: 'pendente' | 'em_progresso' | 'pronto';
  created_at: string;
  updated_at: string;
}

// Buscar todos os OPEX
export const useOPEX = () => {
  return useQuery({
    queryKey: ['OPEX'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as any)
        .from('opex')
        .select('*')
        .order('data_prevista_termino', { ascending: true });

      if (error) throw error;
      return data as unknown as OPEX[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Criar OPEX
export const useCreateOPEX = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (OPEX: Omit<OPEX, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as unknown as any)
        .from('opex')
        .insert([OPEX as unknown])
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['OPEX'] });
      toast.success('OPEX criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar OPEX: ' + error.message);
    },
  });
};

// Atualizar OPEX
export const useUpdateOPEX = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...OPEX }: OPEX) => {
      const { data, error } = await (supabase as unknown as any)
        .from('opex')
        .update(OPEX as unknown)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['OPEX'] });
      toast.success('OPEX atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar OPEX: ' + error.message);
    },
  });
};

// Deletar OPEX
export const useDeleteOPEX = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as unknown as any)
        .from('opex')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['OPEX'] });
      toast.success('OPEX deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar OPEX: ' + error.message);
    },
  });
};

