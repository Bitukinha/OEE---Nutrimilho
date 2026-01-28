export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      equipamentos: {
        Row: {
          capacidade_hora: number | null
          ciclo_ideal: number
          codigo: string | null
          created_at: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          capacidade_hora?: number | null
          ciclo_ideal?: number
          codigo?: string | null
          created_at?: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacidade_hora?: number | null
          ciclo_ideal?: number
          codigo?: string | null
          created_at?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      paradas: {
        Row: {
          categoria: string
          created_at: string
          data: string | null
          duracao: number
          equipamento_id: string | null
          id: string
          motivo: string
          registro_id: string | null
          timestamp: string
          turno_id: string | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          data?: string | null
          duracao?: number
          equipamento_id?: string | null
          id?: string
          motivo: string
          registro_id?: string | null
          timestamp?: string
          turno_id?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string | null
          duracao?: number
          equipamento_id?: string | null
          id?: string
          motivo?: string
          registro_id?: string | null
          timestamp?: string
          turno_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paradas_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paradas_registro_id_fkey"
            columns: ["registro_id"]
            isOneToOne: false
            referencedRelation: "registros_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paradas_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_bloqueados: {
        Row: {
          created_at: string
          data: string
          destino: string
          equipamento_id: string | null
          id: string
          motivo_bloqueio: string
          numero_lacre: string | null
          observacoes: string | null
          quantidade: number
          turno_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: string
          destino: string
          equipamento_id?: string | null
          id?: string
          motivo_bloqueio: string
          numero_lacre?: string | null
          observacoes?: string | null
          quantidade?: number
          turno_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          destino?: string
          equipamento_id?: string | null
          id?: string
          motivo_bloqueio?: string
          numero_lacre?: string | null
          observacoes?: string | null
          quantidade?: number
          turno_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_bloqueados_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_bloqueados_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_producao: {
        Row: {
          capacidade_hora: number | null
          created_at: string
          data: string
          defeitos: number
          disponibilidade: number | null
          equipamento_id: string
          id: string
          observacoes: string | null
          oee: number | null
          performance: number | null
          qualidade: number | null
          tempo_ciclo_ideal: number
          tempo_ciclo_real: number
          tempo_planejado: number
          tempo_real: number
          total_produzido: number
          turno_id: string
          updated_at: string
        }
        Insert: {
          capacidade_hora?: number | null
          created_at?: string
          data?: string
          defeitos?: number
          disponibilidade?: number | null
          equipamento_id: string
          id?: string
          observacoes?: string | null
          oee?: number | null
          performance?: number | null
          qualidade?: number | null
          tempo_ciclo_ideal?: number
          tempo_ciclo_real?: number
          tempo_planejado?: number
          tempo_real?: number
          total_produzido?: number
          turno_id: string
          updated_at?: string
        }
        Update: {
          capacidade_hora?: number | null
          created_at?: string
          data?: string
          defeitos?: number
          disponibilidade?: number | null
          equipamento_id?: string
          id?: string
          observacoes?: string | null
          oee?: number | null
          performance?: number | null
          qualidade?: number | null
          tempo_ciclo_ideal?: number
          tempo_ciclo_real?: number
          tempo_planejado?: number
          tempo_real?: number
          total_produzido?: number
          turno_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_producao_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_producao_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          created_at: string
          hora_fim: string
          hora_inicio: string
          id: string
          meta_oee: number
          nome: string
        }
        Insert: {
          created_at?: string
          hora_fim: string
          hora_inicio: string
          id?: string
          meta_oee?: number
          nome: string
        }
        Update: {
          created_at?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          meta_oee?: number
          nome?: string
        }
        Relationships: []
      }
      opex: {
        Row: {
          id: string
          departamento: string
          descricao: string
          data_inicio: string
          data_prevista_termino: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          departamento: string
          descricao: string
          data_inicio: string
          data_prevista_termino: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          departamento?: string
          descricao?: string
          data_inicio?: string
          data_prevista_termino?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
