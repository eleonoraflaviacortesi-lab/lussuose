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
      client_property_matches: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          match_score: number | null
          match_type: string
          notes: string | null
          property_id: string
          reaction: string | null
          suggested: boolean | null
          suggested_at: string | null
          suggested_by: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          match_score?: number | null
          match_type?: string
          notes?: string | null
          property_id: string
          reaction?: string | null
          suggested?: boolean | null
          suggested_at?: string | null
          suggested_by?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          match_score?: number | null
          match_type?: string
          notes?: string | null
          property_id?: string
          reaction?: string | null
          suggested?: boolean | null
          suggested_at?: string | null
          suggested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_property_matches_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_property_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      clienti: {
        Row: {
          assigned_to: string | null
          bagni: number | null
          budget_max: number | null
          camere: string | null
          card_color: string | null
          comments: Json | null
          contesto: string[] | null
          created_at: string
          data_submission: string | null
          dependance: string | null
          descrizione: string | null
          dimensioni_max: number | null
          dimensioni_min: number | null
          display_order: number
          email: string | null
          emoji: string | null
          ha_visitato: boolean | null
          id: string
          interesse_affitto: string | null
          layout: string | null
          motivo_zona: string[] | null
          mutuo: string | null
          nome: string
          note_extra: string | null
          paese: string | null
          piscina: string | null
          regioni: string[] | null
          sede: string
          status: string
          stile: string | null
          tally_submission_id: string | null
          telefono: string | null
          tempo_ricerca: string | null
          terreno: string | null
          tipologia: string[] | null
          updated_at: string
          uso: string | null
          vicinanza_citta: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          bagni?: number | null
          budget_max?: number | null
          camere?: string | null
          card_color?: string | null
          comments?: Json | null
          contesto?: string[] | null
          created_at?: string
          data_submission?: string | null
          dependance?: string | null
          descrizione?: string | null
          dimensioni_max?: number | null
          dimensioni_min?: number | null
          display_order?: number
          email?: string | null
          emoji?: string | null
          ha_visitato?: boolean | null
          id?: string
          interesse_affitto?: string | null
          layout?: string | null
          motivo_zona?: string[] | null
          mutuo?: string | null
          nome: string
          note_extra?: string | null
          paese?: string | null
          piscina?: string | null
          regioni?: string[] | null
          sede?: string
          status?: string
          stile?: string | null
          tally_submission_id?: string | null
          telefono?: string | null
          tempo_ricerca?: string | null
          terreno?: string | null
          tipologia?: string[] | null
          updated_at?: string
          uso?: string | null
          vicinanza_citta?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          bagni?: number | null
          budget_max?: number | null
          camere?: string | null
          card_color?: string | null
          comments?: Json | null
          contesto?: string[] | null
          created_at?: string
          data_submission?: string | null
          dependance?: string | null
          descrizione?: string | null
          dimensioni_max?: number | null
          dimensioni_min?: number | null
          display_order?: number
          email?: string | null
          emoji?: string | null
          ha_visitato?: boolean | null
          id?: string
          interesse_affitto?: string | null
          layout?: string | null
          motivo_zona?: string[] | null
          mutuo?: string | null
          nome?: string
          note_extra?: string | null
          paese?: string | null
          piscina?: string | null
          regioni?: string[] | null
          sede?: string
          status?: string
          stile?: string | null
          tally_submission_id?: string | null
          telefono?: string | null
          tempo_ricerca?: string | null
          terreno?: string | null
          tipologia?: string[] | null
          updated_at?: string
          uso?: string | null
          vicinanza_citta?: boolean | null
        }
        Relationships: []
      }
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
          valutazioni_fatte: number
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
          valutazioni_fatte?: number
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
          valutazioni_fatte?: number
          vendite_numero?: number
          vendite_valore?: number
        }
        Relationships: []
      }
      demo_users: {
        Row: {
          avatar_emoji: string | null
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          profile_id: string | null
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          profile_id?: string | null
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notizie: {
        Row: {
          card_color: string | null
          comments: Json | null
          created_at: string
          display_order: number
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
          card_color?: string | null
          comments?: Json | null
          created_at?: string
          display_order?: number
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
          card_color?: string | null
          comments?: Json | null
          created_at?: string
          display_order?: number
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
      properties: {
        Row: {
          active: boolean | null
          bathrooms: number | null
          created_at: string
          description: string | null
          features: Json | null
          has_land: boolean | null
          has_pool: boolean | null
          id: string
          image_url: string | null
          land_hectares: number | null
          location: string | null
          price: number | null
          property_type: string | null
          ref_number: string | null
          region: string | null
          rooms: number | null
          scraped_at: string
          surface_mq: number | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean | null
          bathrooms?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          has_land?: boolean | null
          has_pool?: boolean | null
          id?: string
          image_url?: string | null
          land_hectares?: number | null
          location?: string | null
          price?: number | null
          property_type?: string | null
          ref_number?: string | null
          region?: string | null
          rooms?: number | null
          scraped_at?: string
          surface_mq?: number | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean | null
          bathrooms?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          has_land?: boolean | null
          has_pool?: boolean | null
          id?: string
          image_url?: string | null
          land_hectares?: number | null
          location?: string | null
          price?: number | null
          property_type?: string | null
          ref_number?: string | null
          region?: string | null
          rooms?: number | null
          scraped_at?: string
          surface_mq?: number | null
          title?: string
          updated_at?: string
          url?: string
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
          trattative_chiuse_target: number | null
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
          trattative_chiuse_target?: number | null
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
          trattative_chiuse_target?: number | null
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
      is_coordinator_or_admin: { Args: { _user_id: string }; Returns: boolean }
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
