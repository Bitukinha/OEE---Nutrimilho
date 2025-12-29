import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateISO } from '@/lib/dateUtils';

export interface RegistroProducao {
  id: string;
  data: string;
  equipamento_id: string;
  turno_id: string;
  tempo_planejado: number;
  tempo_real: number;
  tempo_ciclo_ideal: number;
  tempo_ciclo_real: number;
  capacidade_hora: number;
  total_produzido: number;
  unidades_boas: number;
  defeitos: number;
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oee: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  equipamentos?: {
    id: string;
    nome: string;
    codigo: string | null;
    capacidade_hora: number | null;
  };
  turnos?: {
    id: string;
    nome: string;
  };
}

export interface RegistroProducaoInput {
  data: string;
  equipamento_id: string;
  turno_id: string;
  tempo_planejado: number;
  tempo_real: number;
  capacidade_hora: number;
  total_produzido: number;
  unidades_boas: number;
  defeitos: number;
  observacoes?: string | null;
}

export const useRegistrosProducao = (filters?: { dataInicio?: string; dataFim?: string; equipamentoId?: string; turnoId?: string }) => {
  return useQuery({
    queryKey: ['registros_producao', filters],
    queryFn: async () => {
      let query = supabase
        .from('registros_producao')
        .select(`
          *,
          equipamentos (id, nome, codigo, capacidade_hora),
          turnos (id, nome)
        `)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (filters?.dataInicio) {
        // Usar a data como está, sem modificações
        query = query.gte('data', filters.dataInicio);
      }
      if (filters?.dataFim) {
        // Usar a data como está, sem modificações
        query = query.lte('data', filters.dataFim);
      }
      if (filters?.equipamentoId) {
        query = query.eq('equipamento_id', filters.equipamentoId);
      }
      if (filters?.turnoId) {
        query = query.eq('turno_id', filters.turnoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as RegistroProducao[];
    },
  });
};

export const useCreateRegistroProducao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (registro: RegistroProducaoInput) => {
      // O input type="date" envia a data no timezone do navegador
      // Precisamos adicionar 1 dia para compensar a conversão UTC
      const [year, month, day] = registro.data.split('-').map(Number);
      const nextDay = day + 1;
      const dataCorrigida = `${year}-${String(month).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('registros_producao')
        .insert({
          ...registro,
          data: dataCorrigida,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros_producao'] });
      toast.success('Registro de produção criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar registro: ' + error.message);
    },
  });
};

export const useDeleteRegistroProducao = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('registros_producao')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros_producao'] });
      toast.success('Registro excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir registro: ' + error.message);
    },
  });
};

export const useOEEMetrics = () => {
  return useQuery({
    queryKey: ['oee_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registros_producao')
        .select('disponibilidade, performance, qualidade, oee')
        .order('data', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 };
      }
      
      const sum = data.reduce(
        (acc, item) => ({
          disponibilidade: acc.disponibilidade + Number(item.disponibilidade || 0),
          performance: acc.performance + Number(item.performance || 0),
          qualidade: acc.qualidade + Number(item.qualidade || 0),
          oee: acc.oee + Number(item.oee || 0),
        }),
        { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 }
      );
      
      return {
        disponibilidade: Number((sum.disponibilidade / data.length).toFixed(1)),
        performance: Number((sum.performance / data.length).toFixed(1)),
        qualidade: Number((sum.qualidade / data.length).toFixed(1)),
        oee: Number((sum.oee / data.length).toFixed(1)),
      };
    },
  });
};
