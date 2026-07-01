import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MotivoParada {
  id: string;
  nome: string;
  categoria: "nao_planejada" | "planejada" | "manutencao" | "setup";
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MotivoBloqueio {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useMotivoParadas = () => {
  return useQuery({
    queryKey: ["motivos_paradas"],
    queryFn: async () => {
      // @ts-expect-error - motivos_paradas table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_paradas")
        .select("*")
        .eq("ativo", true)
        .order("categoria")
        .order("nome");

      if (error) {
        console.error("Erro ao buscar motivos de paradas:", error);
        throw error;
      }

      return data as unknown as MotivoParada[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useMotivoBloqueios = () => {
  return useQuery({
    queryKey: ["motivos_bloqueios"],
    queryFn: async () => {
      // @ts-expect-error - motivos_bloqueios table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_bloqueios")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) {
        console.error("Erro ao buscar motivos de bloqueios:", error);
        throw error;
      }

      return data as unknown as MotivoBloqueio[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// CRUD para Motivos de Paradas
export const useAllMotivoParadas = () => {
  return useQuery({
    queryKey: ["all_motivos_paradas"],
    queryFn: async () => {
      // @ts-expect-error - motivos_paradas table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_paradas")
        .select("*")
        .order("categoria")
        .order("nome");

      if (error) throw error;
      return data as unknown as MotivoParada[];
    },
  });
};

export const useCreateMotivoParada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      motivo: Omit<MotivoParada, "id" | "created_at" | "updated_at">
    ) => {
      // @ts-expect-error - motivos_paradas table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_paradas")
        .insert([motivo as unknown])
        .select();

      console.log("Response:", { data, error });

      if (error) {
        console.error("❌ Erro ao criar motivo:", error);
        throw error;
      }

      console.log("✅ Motivo criado:", data);
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motivos_paradas"] });
      queryClient.invalidateQueries({ queryKey: ["all_motivos_paradas"] });
      toast.success("Motivo de parada criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar motivo: " + error.message);
    },
  });
};

export const useUpdateMotivoParada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...motivo }: MotivoParada) => {
      // @ts-expect-error - motivos_paradas table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_paradas")
        .update(motivo as unknown)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motivos_paradas"] });
      queryClient.invalidateQueries({ queryKey: ["all_motivos_paradas"] });
      toast.success("Motivo de parada atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar motivo: " + error.message);
    },
  });
};

export const useDeleteMotivoParada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-expect-error - motivos_paradas table is not in the base schema but exists in the database
      const { error } = await supabase
        .from("motivos_paradas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motivos_paradas"] });
      queryClient.invalidateQueries({ queryKey: ["all_motivos_paradas"] });
      toast.success("Motivo de parada deletado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar motivo: " + error.message);
    },
  });
};

// CRUD para Motivos de Bloqueios
export const useAllMotivoBloqueios = () => {
  return useQuery({
    queryKey: ["all_motivos_bloqueios"],
    queryFn: async () => {
      // @ts-expect-error - motivos_bloqueios table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_bloqueios")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as MotivoBloqueio[];
    },
  });
};

export const useCreateMotivoBloqueio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      motivo: Omit<MotivoBloqueio, "id" | "created_at" | "updated_at">
    ) => {
      // @ts-expect-error - motivos_bloqueios table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_bloqueios")
        .insert([motivo])
        .select();

      console.log("Response:", { data, error });

      if (error) {
        console.error("❌ Erro ao criar motivo:", error);
        throw error;
      }

      console.log("✅ Motivo criado:", data);
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motivos_bloqueios"] });
      queryClient.invalidateQueries({ queryKey: ["all_motivos_bloqueios"] });
      toast.success("Motivo de bloqueio criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar motivo: " + error.message);
    },
  });
};

export const useUpdateMotivoBloqueio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...motivo }: MotivoBloqueio) => {
      // @ts-expect-error - motivos_bloqueios table is not in the base schema but exists in the database
      const { data, error } = await supabase
        .from("motivos_bloqueios")
        .update(motivo)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motivos_bloqueios"] });
      queryClient.invalidateQueries({ queryKey: ["all_motivos_bloqueios"] });
      toast.success("Motivo de bloqueio atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar motivo: " + error.message);
    },
  });
};

export const useDeleteMotivoBloqueio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-expect-error - motivos_bloqueios table is not in the base schema but exists in the database
      const { error } = await supabase
        .from("motivos_bloqueios")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motivos_bloqueios"] });
      queryClient.invalidateQueries({ queryKey: ["all_motivos_bloqueios"] });
      toast.success("Motivo de bloqueio deletado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar motivo: " + error.message);
    },
  });
};
