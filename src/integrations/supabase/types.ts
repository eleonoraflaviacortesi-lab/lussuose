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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_data: {
        Row: {
          acquisizioni: number
          affitti_numero: number
          affitti_valore: number
          appuntamenti_vendita: number
          clienti_gestiti: number
          contatti_ideali: number
          contatti_reali: number
          created_at: string
          date: string
          fatturato_a_credito: number
          id: string
          incarichi_vendita: number
          notizie_ideali: number
          notizie_reali: number
          nuove_trattative: number
          nuove_trattative_ideali: number
          trattative_chiuse: number
          trattative_chiuse_ideali: number
          updated_at: string
          user_id: string
          vendite_numero: number
          vendite_valore: number
        }
        Insert: {
          acquisizioni?: number
          affitti_numero?: number
          affitti_valore?: number
          appuntamenti_vendita?: number
          clienti_gestiti?: number
          contatti_ideali?: number
          contatti_reali?: number
          created_at?: string
          date: string
          fatturato_a_credito?: number
          id?: string
          incarichi_vendita?: number
          notizie_ideali?: number
          notizie_reali?: number
          nuove_trattative?: number
          nuove_trattative_ideali?: number
          trattative_chiuse?: number
          trattative_chiuse_ideali?: number
          updated_at?: string
          user_id: string
          vendite_numero?: number
          vendite_valore?: number
        }
        Update: {
          acquisizioni?: number
          affitti_numero?: number
          affitti_valore?: number
          appuntamenti_vendita?: number
          clienti_gestiti?: number
          contatti_ideali?: number
          contatti_reali?: number
          created_at?: string
          date?: string
          fatturato_a_credito?: number
          id?: string
          incarichi_vendita?: number
          notizie_ideali?: number
          notizie_reali?: number
          nuove_trattative?: number
          nuove_trattative_ideali?: number
          trattative_chiuse?: number
          trattative_chiuse_ideali?: number
          updated_at?: string
          user_id?: string
          vendite_numero?: number
          vendite_valore?: number
        }
        Relationships: []
      }
      notizie: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          reminder_date: string | null
          status: string
          type: string | null
          updated_at: string
          user_id: string
          zona: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          reminder_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          user_id: string
          zona?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          reminder_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          user_id?: string
          zona?: string | null
        }
        Relationships: []
      }
      operations: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          type: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          type: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          type?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_emoji: string | null
          created_at: string
          full_name: string
          id: string
          role: string
          sede: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string
          full_name: string
          id?: string
          role?: string
          sede?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          sede?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sede_targets: {
        Row: {
          acquisizioni_target: number | null
          appuntamenti_target: number | null
          clienti_target: number | null
          contatti_target: number | null
          created_at: string
          fatturato_target: number | null
          id: string
          incarichi_target: number | null
          month: number
          notizie_target: number | null
          sede: string
          updated_at: string
          vendite_target: number | null
          year: number
        }
        Insert: {
          acquisizioni_target?: number | null
          appuntamenti_target?: number | null
          clienti_target?: number | null
          contatti_target?: number | null
          created_at?: string
          fatturato_target?: number | null
          id?: string
          incarichi_target?: number | null
          month: number
          notizie_target?: number | null
          sede: string
          updated_at?: string
          vendite_target?: number | null
          year: number
        }
        Update: {
          acquisizioni_target?: number | null
          appuntamenti_target?: number | null
          clienti_target?: number | null
          contatti_target?: number | null
          created_at?: string
          fatturato_target?: number | null
          id?: string
          incarichi_target?: number | null
          month?: number
          notizie_target?: number | null
          sede?: string
          updated_at?: string
          vendite_target?: number | null
          year?: number
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          acquisizioni_settimana: number
          appuntamenti_settimana: number
          base_fissa_annuale: number
          contatti_settimana: number
          created_at: string
          fatturato_credito_settimana: number
          fatturato_generato_settimana: number
          id: string
          incarichi_settimana: number
          notizie_settimana: number
          nuove_trattative_settimana: number
          obbiettivo_fatturato: number
          percentuale_personale: number
          prezzo_medio_vendita: number
          provvigione_agenzia: number
          trattative_chiuse_settimana: number
          updated_at: string
          user_id: string
          vendite_settimana: number
        }
        Insert: {
          acquisizioni_settimana?: number
          appuntamenti_settimana?: number
          base_fissa_annuale?: number
          contatti_settimana?: number
          created_at?: string
          fatturato_credito_settimana?: number
          fatturato_generato_settimana?: number
          id?: string
          incarichi_settimana?: number
          notizie_settimana?: number
          nuove_trattative_settimana?: number
          obbiettivo_fatturato?: number
          percentuale_personale?: number
          prezzo_medio_vendita?: number
          provvigione_agenzia?: number
          trattative_chiuse_settimana?: number
          updated_at?: string
          user_id: string
          vendite_settimana?: number
        }
        Update: {
          acquisizioni_settimana?: number
          appuntamenti_settimana?: number
          base_fissa_annuale?: number
          contatti_settimana?: number
          created_at?: string
          fatturato_credito_settimana?: number
          fatturato_generato_settimana?: number
          id?: string
          incarichi_settimana?: number
          notizie_settimana?: number
          nuove_trattative_settimana?: number
          obbiettivo_fatturato?: number
          percentuale_personale?: number
          prezzo_medio_vendita?: number
          provvigione_agenzia?: number
          trattative_chiuse_settimana?: number
          updated_at?: string
          user_id?: string
          vendite_settimana?: number
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
