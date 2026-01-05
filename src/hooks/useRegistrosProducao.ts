import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { emitLocalNotification } from '@/lib/notifications';
import { formatDateISO } from '@/lib/dateUtils';
import { requireAuthorization } from '@/lib/authorizationUtils';
import { useAuth } from '@/context/AuthContext';

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
  paradas?: { id: string; duracao: number; registro_id: string }[];
}

export interface RegistroProducaoInput {
  data: string;
  equipamento_id: string;
  turno_id: string;
  tempo_planejado: number;
  tempo_real: number;
  capacidade_hora: number;
  total_produzido: number;
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
          turnos (id, nome),
          paradas (id, duracao, registro_id)
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
      
      if (error) {
        console.error('Erro ao buscar registros de produção:', error);
        throw error;
      }
      console.log('Registros de produção carregados:', data?.length || 0);
      return data as RegistroProducao[];
    },
  });
};

export const useCreateRegistroProducao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (registro: RegistroProducaoInput) => {
      // Verificar autorização
      requireAuthorization(user?.email);
      
      // A data vem no formato YYYY-MM-DD do input type="date"
      // Não precisamos fazer conversão, apenas usar direto
      
      // Calcular tempo_ciclo_ideal e tempo_ciclo_real baseado na capacidade (capacidade_hora agora representa a 'meta em kg')
      const tempo_ciclo_ideal = registro.capacidade_hora > 0 ? (3600 / (registro.capacidade_hora || 1)) : 2.5; // fallback
      const tempo_ciclo_real = registro.total_produzido > 0 ? (registro.tempo_real * 60 / registro.total_produzido) : tempo_ciclo_ideal;

      // Disponibilidade: tempo_real / tempo_planejado (%), cap 100
      const disponibilidade = registro.tempo_planejado > 0 ? Math.min(100, (registro.tempo_real / registro.tempo_planejado) * 100) : 100;

      // Performance base: ideal vs real cycle
      const performanceBase = tempo_ciclo_real > 0 ? (tempo_ciclo_ideal / tempo_ciclo_real) * 100 : 100;

      // Ajuste por meta (capacidade_hora usado como meta em kg). Se a produção ficou abaixo da meta, reduz a performance proporcionalmente.
      const metaKg = registro.capacidade_hora || 0;
      const alcanceMeta = metaKg > 0 ? Math.min(1, registro.total_produzido / metaKg) : 1;
      const performance = Number((Math.max(0, Math.min(100, performanceBase * alcanceMeta))).toFixed(1));

      // Qualidade: (produzido - defeitos) / produzido
      const qualidade = registro.total_produzido > 0 ? Number((((registro.total_produzido - registro.defeitos) / registro.total_produzido) * 100).toFixed(1)) : 100;

      // OEE = disponibilidade * performance * qualidade / 10000 -> normalized to percent
      const oee = Number(((disponibilidade * performance * qualidade) / 10000).toFixed(1));

      // The DB defines some columns (disponibilidade, performance, qualidade, oee)
      // as generated columns. Do not attempt to insert values into them — let
      // the database compute them. Insert only the base fields and tempo values.
      const insertPayload: Record<string, any> = {
        data: registro.data,
        equipamento_id: registro.equipamento_id,
        turno_id: registro.turno_id,
        tempo_planejado: registro.tempo_planejado,
        tempo_real: registro.tempo_real,
        tempo_ciclo_ideal,
        tempo_ciclo_real,
        capacidade_hora: registro.capacidade_hora,
        total_produzido: registro.total_produzido,
        defeitos: registro.defeitos,
        observacoes: registro.observacoes ?? null,
      };

      const { data, error } = await supabase
        .from('registros_producao')
        .insert(insertPayload)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      try { emitLocalNotification({ table: 'registros_producao', event: 'INSERT' }); } catch (e) { console.warn('emitLocalNotification failed', e); }
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === 'registros_producao';
        }
      });
      // Invalidar também as queries derivadas
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && (query.queryKey[0] === 'oee_por_turno' || query.queryKey[0] === 'oee_metrics');
        }
      });
      toast.success('Registro de produção criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar registro: ' + error.message);
    },
  });
};

export const useDeleteRegistroProducao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar autorização
      requireAuthorization(user?.email);
      
      console.log('🗑️ Deletando registro:', id);
      
      const { error, data } = await supabase
        .from('registros_producao')
        .delete()
        .eq('id', id)
        .select();
      
      console.log('Delete response:', { error, data });
      
      if (error) {
        console.error('❌ Erro ao deletar:', error);
        throw error;
      }
      
      console.log('✅ Deletado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === 'registros_producao';
        }
      });
      // Invalidar também as queries derivadas
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && (query.queryKey[0] === 'oee_por_turno' || query.queryKey[0] === 'oee_metrics');
        }
      });
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
      // Fetch latest registros including paradas and related meta to compute metrics client-side
      const { data: registros, error } = await supabase
        .from('registros_producao')
        .select(`
          *,
          paradas (id, duracao, registro_id),
          equipamentos (capacidade_hora)
        `)
        .order('data', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (!registros || registros.length === 0) {
        return { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 };
      }

      const sums = registros.reduce((acc, r: any) => {
        const paradasSum = r.paradas?.reduce((a: number, p: any) => a + (p.duracao || 0), 0) || 0;
        const disponibilidade = r.tempo_planejado > 0 ? Math.max(0, ((r.tempo_planejado - paradasSum) / r.tempo_planejado) * 100) : 0;
        const metaKg = (r.equipamentos && r.equipamentos.capacidade_hora) || r.capacidade_hora || 0;
        const performance = metaKg > 0 ? Math.min(100, (r.total_produzido / metaKg) * 100) : 0;
        const unidadesBoas = Math.max(0, (r.total_produzido - (r.defeitos || 0)));
        const qualidade = r.total_produzido > 0 ? Math.max(0, (unidadesBoas / r.total_produzido) * 100) : 0;
        const oee = (disponibilidade * performance * qualidade) / 10000;

        acc.disponibilidade += disponibilidade;
        acc.performance += performance;
        acc.qualidade += qualidade;
        acc.oee += oee;
        return acc;
      }, { disponibilidade: 0, performance: 0, qualidade: 0, oee: 0 });

      const len = registros.length;
      return {
        disponibilidade: Number((sums.disponibilidade / len).toFixed(1)),
        performance: Number((sums.performance / len).toFixed(1)),
        qualidade: Number((sums.qualidade / len).toFixed(1)),
        oee: Number((sums.oee / len).toFixed(1)),
      };
    },
  });
};
