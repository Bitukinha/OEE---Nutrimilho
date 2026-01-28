import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emitLocalNotification } from '@/lib/notifications';
import { requireAuthorization } from "@/lib/authorizationUtils";
import { useAuth } from "@/context/AuthContext";

export interface Parada {
  id: string;
  turno_id: string | null;
  equipamento_id: string | null;
  registro_id: string | null;
  data: string;
  duracao: number;
  motivo: string;
  categoria: string;
  timestamp: string;
  created_at: string;
  turnos?: {
    id: string;
    nome: string;
  };
  equipamentos?: {
    id: string;
    nome: string;
  };
}

export interface ParadaInput {
  turno_id: string;
  equipamento_id: string;
  data: string;
  duracao: number;
  motivo: string;
  categoria?: string;
  observacoes?: string;
}

export const useParadas = (filters?: {
  dataInicio?: string;
  dataFim?: string;
  turnoId?: string;
}) => {
  return useQuery({
    queryKey: ["paradas", filters],
    queryFn: async () => {
      let query = supabase
        .from("paradas")
        .select(
          `
          *,
          turnos (id, nome),
          equipamentos (id, nome)
        `
        )
        .not("turno_id", "is", null)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.dataInicio) {
        query = query.gte("data", filters.dataInicio);
      }
      if (filters?.dataFim) {
        query = query.lte("data", filters.dataFim);
      }
      if (filters?.turnoId) {
        query = query.eq("turno_id", filters.turnoId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar paradas:', error);
        throw error;
      }
      console.log('Paradas carregadas:', data?.length || 0);
      return data as Parada[];
    },
  });
};

export const useCreateParada = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (parada: ParadaInput) => {
      console.log('Attempting to create parada, payload:', parada, 'user:', user?.email);
      // Verificar autorização
      requireAuthorization(user?.email);
      
      // Buscar o nome do motivo se um ID foi fornecido
      let motivoText = parada.motivo;
      try {
        // @ts-expect-error - motivos_paradas table is not in the base schema but exists in the database
        const { data: motivoData } = await supabase
          .from('motivos_paradas')
          .select('nome')
          .eq('id', parada.motivo)
          .single();
        
        if (motivoData?.nome) {
          motivoText = motivoData.nome;
        }
      } catch (e) {
        console.warn('Could not fetch motivo name:', e);
      }
      
      // Build payload including only columns expected in the DB to avoid
      // sending fields that might not exist (eg. observacoes)
      const insertPayload: Record<string, any> = {
        turno_id: parada.turno_id,
        equipamento_id: parada.equipamento_id,
        data: parada.data,
        duracao: parada.duracao,
        motivo: motivoText,
        categoria: parada.categoria || "nao_planejada",
      };

      // Try to associate this parada with an existing production record (registro_producao)
      // matching same date, turno and equipamento so it affects disponibilidade for that registro.
      try {
        const { data: registrosMatch, error: regError } = await supabase
          .from('registros_producao')
          .select('id')
          .eq('data', parada.data)
          .eq('turno_id', parada.turno_id)
          .eq('equipamento_id', parada.equipamento_id)
          .limit(1);

        if (!regError && registrosMatch && registrosMatch.length > 0) {
          insertPayload.registro_id = registrosMatch[0].id;
        }
      } catch (e) {
        console.warn('Could not lookup registro to associate parada:', e);
      }

      const { data, error } = await supabase
        .from("paradas")
        .insert(insertPayload)
        .select()
        .single();

      console.log('Create parada response:', { data, error });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Emit local notification for immediate UI feedback
      try { emitLocalNotification({ table: 'paradas', event: 'INSERT' }); } catch (e) {
        console.warn('emitLocalNotification failed', e);
      }
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === "paradas";
        }
      });
      // Also invalidate registros_producao so UI recalculates disponibilidade per registro
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === 'registros_producao';
        }
      });
      // Invalidar também as queries de OEE pois paradas afetam disponibilidade
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === 'oee_por_turno';
        }
      });
      toast.success("Parada registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar parada: " + error.message);
    },
  });
};

export const useDeleteParada = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar autorização
      requireAuthorization(user?.email);
      
      console.log('🗑️ Deletando parada:', id);
      
      const { error, data } = await supabase.from("paradas").delete().eq("id", id).select();

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
          return Array.isArray(query.queryKey) && query.queryKey[0] === "paradas";
        }
      });
      // Invalidar também as queries de OEE pois paradas afetam disponibilidade
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === 'oee_por_turno';
        }
      });
      toast.success("Parada excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir parada: " + error.message);
    },
  });
};
