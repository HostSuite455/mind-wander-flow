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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          adults_count: number | null
          booking_reference: string | null
          booking_status: string | null
          channel: string | null
          check_in: string
          check_out: string
          children_count: number | null
          created_at: string | null
          currency: string | null
          external_booking_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests_count: number | null
          host_id: string
          id: string
          last_sync_at: string | null
          property_id: string
          special_requests: string | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          adults_count?: number | null
          booking_reference?: string | null
          booking_status?: string | null
          channel?: string | null
          check_in: string
          check_out: string
          children_count?: number | null
          created_at?: string | null
          currency?: string | null
          external_booking_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          host_id: string
          id?: string
          last_sync_at?: string | null
          property_id: string
          special_requests?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          adults_count?: number | null
          booking_reference?: string | null
          booking_status?: string | null
          channel?: string | null
          check_in?: string
          check_out?: string
          children_count?: number | null
          created_at?: string | null
          currency?: string | null
          external_booking_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          host_id?: string
          id?: string
          last_sync_at?: string | null
          property_id?: string
          special_requests?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      calendar_blocks: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          host_id: string
          id: string
          is_active: boolean | null
          property_id: string
          reason: string | null
          source: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          host_id: string
          id?: string
          is_active?: boolean | null
          property_id: string
          reason?: string | null
          source?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          host_id?: string
          id?: string
          is_active?: boolean | null
          property_id?: string
          reason?: string | null
          source?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_blocks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: number
          messages: Json | null
          mode: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          messages?: Json | null
          mode?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          messages?: Json | null
          mode?: string | null
          title?: string | null
        }
        Relationships: []
      }
      guest_codes: {
        Row: {
          check_in: string
          check_out: string
          code: string
          created_at: string | null
          guest_name: string | null
          nome_struttura: string | null
          prompt_ai: string | null
          property_id: string | null
        }
        Insert: {
          check_in: string
          check_out: string
          code: string
          created_at?: string | null
          guest_name?: string | null
          nome_struttura?: string | null
          prompt_ai?: string | null
          property_id?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string
          code?: string
          created_at?: string | null
          guest_name?: string | null
          nome_struttura?: string | null
          prompt_ai?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_codes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ical_configs: {
        Row: {
          channel_manager_name: string | null
          config_type: string | null
          created_at: string | null
          host_id: string | null
          id: string
          is_active: boolean | null
          max_ical_urls: number | null
          property_id: string
          status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          channel_manager_name?: string | null
          config_type?: string | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          max_ical_urls?: number | null
          property_id: string
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_manager_name?: string | null
          config_type?: string | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          max_ical_urls?: number | null
          property_id?: string
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ical_configs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ical_urls: {
        Row: {
          created_at: string | null
          ical_config_id: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_sync: string | null
          last_sync_at: string | null
          last_sync_status: string | null
          ota_name: string
          source: string | null
          sync_frequency_minutes: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          ical_config_id: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync?: string | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          ota_name: string
          source?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          ical_config_id?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync?: string | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          ota_name?: string
          source?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ical_urls_ical_config_id_fkey"
            columns: ["ical_config_id"]
            isOneToOne: false
            referencedRelation: "ical_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_patterns: {
        Row: {
          category_weights: Json
          common_phrases: string[] | null
          created_at: string | null
          id: string
          patterns: Json
          property_id: string
          success_rate: number | null
          total_questions: number | null
          updated_at: string | null
        }
        Insert: {
          category_weights?: Json
          common_phrases?: string[] | null
          created_at?: string | null
          id?: string
          patterns?: Json
          property_id: string
          success_rate?: number | null
          total_questions?: number | null
          updated_at?: string | null
        }
        Update: {
          category_weights?: Json
          common_phrases?: string[] | null
          created_at?: string | null
          id?: string
          patterns?: Json
          property_id?: string
          success_rate?: number | null
          total_questions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_property"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_patterns_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      message_feedback: {
        Row: {
          category: string | null
          confidence_score: number | null
          created_at: string | null
          guest_code: string
          id: string
          message_id: string
          pattern: string[] | null
          property_id: string
          question: string
          response: string
          sub_category: string | null
          was_helpful: boolean
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          guest_code: string
          id?: string
          message_id: string
          pattern?: string[] | null
          property_id: string
          question: string
          response: string
          sub_category?: string | null
          was_helpful: boolean
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          guest_code?: string
          id?: string
          message_id?: string
          pattern?: string[] | null
          property_id?: string
          question?: string
          response?: string
          sub_category?: string | null
          was_helpful?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_feedback_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      place_cache: {
        Row: {
          exists: boolean
          name: string
          official_name: string | null
          types: string[] | null
        }
        Insert: {
          exists: boolean
          name: string
          official_name?: string | null
          types?: string[] | null
        }
        Update: {
          exists?: boolean
          name?: string
          official_name?: string | null
          types?: string[] | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          ai_home_prompt: string | null
          auto_send_credentials: boolean | null
          city: string | null
          created_at: string | null
          host_id: string
          ical_url: string | null
          ical_url_hash: string | null
          id: string
          max_guests: number | null
          nome: string
          status: string | null
          updated_at: string | null
          whatsapp_link: string | null
        }
        Insert: {
          address?: string | null
          ai_home_prompt?: string | null
          auto_send_credentials?: boolean | null
          city?: string | null
          created_at?: string | null
          host_id: string
          ical_url?: string | null
          ical_url_hash?: string | null
          id?: string
          max_guests?: number | null
          nome?: string
          status?: string | null
          updated_at?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          address?: string | null
          ai_home_prompt?: string | null
          auto_send_credentials?: boolean | null
          city?: string | null
          created_at?: string | null
          host_id?: string
          ical_url?: string | null
          ical_url_hash?: string | null
          id?: string
          max_guests?: number | null
          nome?: string
          status?: string | null
          updated_at?: string | null
          whatsapp_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      property_ai_data: {
        Row: {
          access_info: string | null
          aria_condizionata: string | null
          asciugacapelli: string | null
          asciugamani: string | null
          asciugatrice: string | null
          cassaforte: string | null
          coperte_extra: string | null
          created_at: string | null
          extra_notes: string | null
          faqs: Json | null
          forno_elettrico: string | null
          forno_microonde: string | null
          frigorifero: string | null
          heating_instructions: string | null
          id: string
          lavastoviglie: string | null
          lavatrice: string | null
          macchina_caffe: string | null
          parking_info: string | null
          property_id: string | null
          smoking_rules: string | null
          stendibiancheria: string | null
          termostato: string | null
          trash_rules: string | null
          tv: string | null
          updated_at: string | null
          wifi_full_coverage: boolean | null
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          access_info?: string | null
          aria_condizionata?: string | null
          asciugacapelli?: string | null
          asciugamani?: string | null
          asciugatrice?: string | null
          cassaforte?: string | null
          coperte_extra?: string | null
          created_at?: string | null
          extra_notes?: string | null
          faqs?: Json | null
          forno_elettrico?: string | null
          forno_microonde?: string | null
          frigorifero?: string | null
          heating_instructions?: string | null
          id?: string
          lavastoviglie?: string | null
          lavatrice?: string | null
          macchina_caffe?: string | null
          parking_info?: string | null
          property_id?: string | null
          smoking_rules?: string | null
          stendibiancheria?: string | null
          termostato?: string | null
          trash_rules?: string | null
          tv?: string | null
          updated_at?: string | null
          wifi_full_coverage?: boolean | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          access_info?: string | null
          aria_condizionata?: string | null
          asciugacapelli?: string | null
          asciugamani?: string | null
          asciugatrice?: string | null
          cassaforte?: string | null
          coperte_extra?: string | null
          created_at?: string | null
          extra_notes?: string | null
          faqs?: Json | null
          forno_elettrico?: string | null
          forno_microonde?: string | null
          frigorifero?: string | null
          heating_instructions?: string | null
          id?: string
          lavastoviglie?: string | null
          lavatrice?: string | null
          macchina_caffe?: string | null
          parking_info?: string | null
          property_id?: string | null
          smoking_rules?: string | null
          stendibiancheria?: string | null
          termostato?: string | null
          trash_rules?: string | null
          tv?: string | null
          updated_at?: string | null
          wifi_full_coverage?: boolean | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_ai_data_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          host_id: string
          id: string
          price_cents: number
          status: string | null
          subscription_tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          host_id: string
          id?: string
          price_cents: number
          status?: string | null
          subscription_tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          host_id?: string
          id?: string
          price_cents?: number
          status?: string | null
          subscription_tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unanswered_questions: {
        Row: {
          created_at: string | null
          guest_code: string
          id: string
          property_id: string
          question: string
          status: string
        }
        Insert: {
          created_at?: string | null
          guest_code: string
          id?: string
          property_id: string
          question: string
          status?: string
        }
        Update: {
          created_at?: string | null
          guest_code?: string
          id?: string
          property_id?: string
          question?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "unanswered_questions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          password: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          password?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          password?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_learning_stats: {
        Args: { p_property_id: string }
        Returns: {
          category_distribution: Json
          recent_improvements: Json
          success_rate: number
          top_patterns: Json
          total_questions: number
        }[]
      }
      get_subscription_price: {
        Args: { existing_count?: number; tier: string }
        Returns: number
      }
      reset_learning_stats: {
        Args: { p_property_id: string }
        Returns: undefined
      }
      validate_ical_config: {
        Args: {
          p_channel_manager_name: string
          p_config_type: string
          p_property_id: string
        }
        Returns: boolean
      }
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
