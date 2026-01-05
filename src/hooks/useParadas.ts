import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  return useMutation({
    mutationFn: async (parada: ParadaInput) => {
      const { data, error } = await supabase
        .from("paradas")
        .insert({
          ...parada,
          categoria: parada.categoria || "nao_planejada",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paradas"] });
      toast.success("Parada registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar parada: " + error.message);
    },
  });
};

export const useDeleteParada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("paradas").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paradas"] });
      toast.success("Parada excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir parada: " + error.message);
    },
  });
};
