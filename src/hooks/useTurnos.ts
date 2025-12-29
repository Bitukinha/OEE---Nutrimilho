import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Turno {
  id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
  meta_oee: number;
  created_at: string;
}

export const useTurnos = () => {
  return useQuery({
    queryKey: ['turnos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .order('hora_inicio');
      
      if (error) throw error;
      return data as Turno[];
    },
  });
};

export const useUpdateMetaOEE = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ turnoId, metaOee }: { turnoId: string; metaOee: number }) => {
      const { error } = await supabase
        .from('turnos')
        .update({ meta_oee: metaOee })
        .eq('id', turnoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['oee_por_turno'] });
    },
  });
};
