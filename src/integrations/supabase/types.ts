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
      availability_blocks: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          property_id: string
          reason: string | null
          source: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          property_id: string
          reason?: string | null
          source: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          property_id?: string
          reason?: string | null
          source?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
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
      channel_accounts: {
        Row: {
          created_at: string | null
          host_id: string
          ics_export_token: string | null
          ics_pull_url: string | null
          id: string
          kind: Database["public"]["Enums"]["channel_kind"]
          last_sync_at: string | null
          last_sync_status: string | null
          name: string
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          host_id: string
          ics_export_token?: string | null
          ics_pull_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["channel_kind"]
          last_sync_at?: string | null
          last_sync_status?: string | null
          name: string
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          host_id?: string
          ics_export_token?: string | null
          ics_pull_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["channel_kind"]
          last_sync_at?: string | null
          last_sync_status?: string | null
          name?: string
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_accounts_property_id_fkey"
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
      cleaners: {
        Row: {
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cleaning_tasks: {
        Row: {
          assigned_cleaner_id: string | null
          created_at: string | null
          duration_min: number
          id: string
          notes: string | null
          property_id: string
          reservation_id: string | null
          scheduled_end: string
          scheduled_start: string
          status: string
          type: string
        }
        Insert: {
          assigned_cleaner_id?: string | null
          created_at?: string | null
          duration_min?: number
          id?: string
          notes?: string | null
          property_id: string
          reservation_id?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string
          type: string
        }
        Update: {
          assigned_cleaner_id?: string | null
          created_at?: string | null
          duration_min?: number
          id?: string
          notes?: string | null
          property_id?: string
          reservation_id?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_assigned_cleaner_id_fkey"
            columns: ["assigned_cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
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
          api_endpoint: string | null
          api_key_name: string | null
          channel_manager_name: string | null
          config_type: string | null
          created_at: string | null
          host_id: string | null
          id: string
          is_active: boolean | null
          max_ical_urls: number | null
          property_id: string
          provider_config: Json | null
          status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_name?: string | null
          channel_manager_name?: string | null
          config_type?: string | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          max_ical_urls?: number | null
          property_id: string
          provider_config?: Json | null
          status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_name?: string | null
          channel_manager_name?: string | null
          config_type?: string | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          max_ical_urls?: number | null
          property_id?: string
          provider_config?: Json | null
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
      ical_sources: {
        Row: {
          active: boolean
          channel: string
          created_at: string | null
          id: string
          last_error: string | null
          last_status: string | null
          last_sync_at: string | null
          property_id: string
          url: string
        }
        Insert: {
          active?: boolean
          channel: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_sync_at?: string | null
          property_id: string
          url: string
        }
        Update: {
          active?: boolean
          channel?: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_sync_at?: string | null
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ical_sources_property_id_fkey"
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
      listings: {
        Row: {
          account_id: string | null
          created_at: string | null
          external_id: string | null
          id: string
          property_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          property_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "channel_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
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
          amenities: Json | null
          auto_send_credentials: boolean | null
          base_price: number | null
          bathrooms: number | null
          bedrooms: number | null
          beds: number | null
          check_in_from: string | null
          check_out_until: string | null
          city: string | null
          cleaning_fee: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          guests: number | null
          host_id: string
          ical_url: string | null
          ical_url_hash: string | null
          id: string
          lat: number | null
          lng: number | null
          max_guests: number | null
          nome: string
          size_sqm: number | null
          status: string | null
          updated_at: string | null
          whatsapp_link: string | null
        }
        Insert: {
          address?: string | null
          ai_home_prompt?: string | null
          amenities?: Json | null
          auto_send_credentials?: boolean | null
          base_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: number | null
          check_in_from?: string | null
          check_out_until?: string | null
          city?: string | null
          cleaning_fee?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          guests?: number | null
          host_id: string
          ical_url?: string | null
          ical_url_hash?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          nome?: string
          size_sqm?: number | null
          status?: string | null
          updated_at?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          address?: string | null
          ai_home_prompt?: string | null
          amenities?: Json | null
          auto_send_credentials?: boolean | null
          base_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: number | null
          check_in_from?: string | null
          check_out_until?: string | null
          city?: string | null
          cleaning_fee?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          guests?: number | null
          host_id?: string
          ical_url?: string | null
          ical_url_hash?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          nome?: string
          size_sqm?: number | null
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
      reservations: {
        Row: {
          created_at: string | null
          end_date: string
          guest_name: string | null
          id: string
          property_id: string
          source: string
          start_date: string
          uid: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          guest_name?: string | null
          id?: string
          property_id: string
          source: string
          start_date: string
          uid?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          guest_name?: string | null
          id?: string
          property_id?: string
          source?: string
          start_date?: string
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_property_id_fkey"
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
      sync_logs: {
        Row: {
          account_id: string | null
          at: string | null
          id: number
          level: string
          message: string
        }
        Insert: {
          account_id?: string | null
          at?: string | null
          id?: number
          level: string
          message: string
        }
        Update: {
          account_id?: string | null
          at?: string | null
          id?: number
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "channel_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      channel_kind: "ics" | "channex" | "direct" | "mock"
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
    Enums: {
      channel_kind: ["ics", "channex", "direct", "mock"],
    },
  },
} as const
