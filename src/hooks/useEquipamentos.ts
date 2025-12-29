import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Equipamento {
  id: string;
  nome: string;
  codigo: string | null;
  ciclo_ideal?: number;
  capacidade_hora: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EquipamentoInput {
  nome: string;
  codigo?: string | null;
  capacidade_hora?: number | null;
  status: string;
}

export const useEquipamentos = () => {
  return useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Equipamento[];
    },
  });
};

export const useCreateEquipamento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (equipamento: EquipamentoInput) => {
      const { data, error } = await supabase
        .from('equipamentos')
        .insert(equipamento)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Segmento criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar segmento: ' + error.message);
    },
  });
};

export const useUpdateEquipamento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...equipamento }: Partial<Equipamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('equipamentos')
        .update(equipamento)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Segmento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar segmento: ' + error.message);
    },
  });
};

export const useDeleteEquipamento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Segmento excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir segmento: ' + error.message);
    },
  });
};
