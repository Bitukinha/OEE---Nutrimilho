import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { requireAuthorization } from '@/lib/authorizationUtils';
import { useAuth } from '@/context/AuthContext';

export interface ProdutoBloqueado {
  id: string;
  data: string;
  turno_id: string | null;
  equipamento_id: string | null;
  motivo_bloqueio: string;
  quantidade: number;
  numero_lacre: string | null;
  destino: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  turnos?: {
    id: string;
    nome: string;
  };
  equipamentos?: {
    id: string;
    nome: string;
  };
}

export interface ProdutoBloqueadoInput {
  data: string;
  turno_id: string;
  equipamento_id: string;
  motivo_bloqueio: string;
  quantidade: number;
  numero_lacre?: string | null;
  destino: string;
  observacoes?: string | null;
}

export const useProdutosBloqueados = (filters?: { dataInicio?: string; dataFim?: string; turnoId?: string }) => {
  return useQuery({
    queryKey: ['produtos_bloqueados', filters],
    queryFn: async () => {
      let query = supabase
        .from('produtos_bloqueados')
        .select(`
          *,
          turnos (id, nome),
          equipamentos (id, nome)
        `)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (filters?.dataInicio) {
        query = query.gte('data', filters.dataInicio);
      }
      if (filters?.dataFim) {
        query = query.lte('data', filters.dataFim);
      }
      if (filters?.turnoId) {
        query = query.eq('turno_id', filters.turnoId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar produtos bloqueados:', error);
        throw error;
      }
      console.log('Produtos bloqueados carregados:', data?.length || 0);
      return data as ProdutoBloqueado[];
    },
  });
};

export const useCreateProdutoBloqueado = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (produto: ProdutoBloqueadoInput) => {
      // Verificar autorização
      requireAuthorization(user?.email);
      
      const { data, error } = await supabase
        .from('produtos_bloqueados')
        .insert(produto)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos_bloqueados'] });
      toast.success('Produto bloqueado registrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar produto: ' + error.message);
    },
  });
};

export const useDeleteProdutoBloqueado = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar autorização
      requireAuthorization(user?.email);
      
      const { error } = await supabase
        .from('produtos_bloqueados')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos_bloqueados'] });
      toast.success('Registro excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir registro: ' + error.message);
    },
  });
};

// Hook para métricas de qualidade
export const useQualidadeMetrics = () => {
  return useQuery({
    queryKey: ['qualidade_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos_bloqueados')
        .select('quantidade, destino, motivo_bloqueio');
      
      if (error) throw error;
      
      const total = data?.reduce((acc, item) => acc + item.quantidade, 0) || 0;
      
      // Agrupar por destino
      const porDestino: Record<string, number> = {};
      data?.forEach(item => {
        porDestino[item.destino] = (porDestino[item.destino] || 0) + item.quantidade;
      });
      
      // Agrupar por motivo
      const porMotivo: Record<string, number> = {};
      data?.forEach(item => {
        porMotivo[item.motivo_bloqueio] = (porMotivo[item.motivo_bloqueio] || 0) + item.quantidade;
      });
      
      return {
        totalBloqueado: total,
        porDestino,
        porMotivo,
      };
    },
  });
};
