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
      automatic_payment_logs: {
        Row: {
          amount_cents: number
          cleaner_id: string
          created_at: string | null
          error_message: string | null
          host_id: string
          id: string
          processed_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          task_id: string
        }
        Insert: {
          amount_cents: number
          cleaner_id: string
          created_at?: string | null
          error_message?: string | null
          host_id: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          task_id: string
        }
        Update: {
          amount_cents?: number
          cleaner_id?: string
          created_at?: string | null
          error_message?: string | null
          host_id?: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automatic_payment_logs_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automatic_payment_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
        ]
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
      checklist_completions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          item_id: string | null
          notes: string | null
          photo_url: string | null
          task_checklist_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          photo_url?: string | null
          task_checklist_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          photo_url?: string | null
          task_checklist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_task_checklist_id_fkey"
            columns: ["task_checklist_id"]
            isOneToOne: false
            referencedRelation: "task_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          requires_note: boolean | null
          requires_photo: boolean | null
          template_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          requires_note?: boolean | null
          requires_photo?: boolean | null
          template_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          requires_note?: boolean | null
          requires_photo?: boolean | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_activity_logs: {
        Row: {
          action: string
          cleaner_id: string | null
          cleaning_task_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          cleaner_id?: string | null
          cleaning_task_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          cleaner_id?: string | null
          cleaning_task_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_activity_logs_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_activity_logs_cleaning_task_id_fkey"
            columns: ["cleaning_task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_assignments: {
        Row: {
          active: boolean
          cleaner_id: string
          created_at: string | null
          id: string
          property_id: string
          weight: number
        }
        Insert: {
          active?: boolean
          cleaner_id: string
          created_at?: string | null
          id?: string
          property_id: string
          weight?: number
        }
        Update: {
          active?: boolean
          cleaner_id?: string
          created_at?: string | null
          id?: string
          property_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_assignments_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_invitations: {
        Row: {
          accepted_at: string | null
          cleaner_id: string | null
          created_at: string | null
          email: string | null
          expires_at: string
          host_id: string
          id: string
          invitation_code: string
          phone: string | null
          property_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          cleaner_id?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          host_id: string
          id?: string
          invitation_code: string
          phone?: string | null
          property_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          cleaner_id?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          host_id?: string
          id?: string
          invitation_code?: string
          phone?: string | null
          property_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_invitations_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_payment_schedules: {
        Row: {
          auto_pay: boolean | null
          cleaner_id: string | null
          created_at: string | null
          frequency: string | null
          id: string
          payment_method_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_pay?: boolean | null
          cleaner_id?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          payment_method_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_pay?: boolean | null
          cleaner_id?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          payment_method_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_payment_schedules_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_payment_schedules_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_rates: {
        Row: {
          amount_cents: number
          cleaner_id: string
          created_at: string | null
          id: string
          property_id: string | null
          rate_type: string
        }
        Insert: {
          amount_cents: number
          cleaner_id: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          rate_type?: string
        }
        Update: {
          amount_cents?: number
          cleaner_id?: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          rate_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_rates_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaner_rates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaners: {
        Row: {
          availability: Json | null
          avatar_url: string | null
          email: string | null
          id: string
          name: string
          notification_preferences: Json | null
          owner_id: string
          phone: string | null
          skills: Json | null
          user_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          availability?: Json | null
          avatar_url?: string | null
          email?: string | null
          id?: string
          name: string
          notification_preferences?: Json | null
          owner_id: string
          phone?: string | null
          skills?: Json | null
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          availability?: Json | null
          avatar_url?: string | null
          email?: string | null
          id?: string
          name?: string
          notification_preferences?: Json | null
          owner_id?: string
          phone?: string | null
          skills?: Json | null
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      cleaning_tasks: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_cleaner_id: string | null
          billable_min: number | null
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
          actual_end?: string | null
          actual_start?: string | null
          assigned_cleaner_id?: string | null
          billable_min?: number | null
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
          actual_end?: string | null
          actual_start?: string | null
          assigned_cleaner_id?: string | null
          billable_min?: number | null
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
      conversation_messages: {
        Row: {
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string
          read_by_cleaner: boolean | null
          read_by_host: boolean | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type?: string
          read_by_cleaner?: boolean | null
          read_by_host?: boolean | null
          sender_id: string
          sender_type: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string
          read_by_cleaner?: boolean | null
          read_by_host?: boolean | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "host_cleaner_conversations"
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
      host_cleaner_conversations: {
        Row: {
          cleaner_id: string
          created_at: string | null
          flag_reason: string | null
          flagged_at: string | null
          flagged_for_support: boolean | null
          host_id: string
          id: string
          last_message_at: string | null
          property_id: string | null
        }
        Insert: {
          cleaner_id: string
          created_at?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_for_support?: boolean | null
          host_id: string
          id?: string
          last_message_at?: string | null
          property_id?: string | null
        }
        Update: {
          cleaner_id?: string
          created_at?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_for_support?: boolean | null
          host_id?: string
          id?: string
          last_message_at?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_cleaner_conversations_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_cleaner_conversations_property_id_fkey"
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
          channel_type: string | null
          created_at: string | null
          id: string
          last_error: string | null
          last_status: string | null
          last_sync_at: string | null
          platform_instructions: string | null
          property_id: string
          url: string
        }
        Insert: {
          active?: boolean
          channel: string
          channel_type?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_sync_at?: string | null
          platform_instructions?: string | null
          property_id: string
          url: string
        }
        Update: {
          active?: boolean
          channel?: string
          channel_type?: string | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_sync_at?: string | null
          platform_instructions?: string | null
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
      inventory_items: {
        Row: {
          auto_reorder: boolean | null
          category: string
          cost_per_unit: number | null
          created_at: string | null
          current_stock: number | null
          id: string
          max_threshold: number | null
          min_threshold: number | null
          name: string
          property_id: string | null
          supplier_info: Json | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          auto_reorder?: boolean | null
          category: string
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          max_threshold?: number | null
          min_threshold?: number | null
          name: string
          property_id?: string | null
          supplier_info?: Json | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_reorder?: boolean | null
          category?: string
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          max_threshold?: number | null
          min_threshold?: number | null
          name?: string
          property_id?: string | null
          supplier_info?: Json | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          cleaner_id: string | null
          cleaning_task_id: string | null
          created_at: string | null
          id: string
          item_id: string | null
          movement_type: string
          quantity: number
          reason: string | null
        }
        Insert: {
          cleaner_id?: string | null
          cleaning_task_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          movement_type: string
          quantity: number
          reason?: string | null
        }
        Update: {
          cleaner_id?: string | null
          cleaning_task_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          movement_type?: string
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_cleaning_task_id_fkey"
            columns: ["cleaning_task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
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
      manual_payment_batches: {
        Row: {
          cleaner_id: string
          created_at: string | null
          host_id: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          status: string
          task_count: number
          total_amount_cents: number
          updated_at: string | null
        }
        Insert: {
          cleaner_id: string
          created_at?: string | null
          host_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          period_end: string
          period_start: string
          status?: string
          task_count: number
          total_amount_cents: number
          updated_at?: string | null
        }
        Update: {
          cleaner_id?: string
          created_at?: string | null
          host_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          status?: string
          task_count?: number
          total_amount_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_payment_batches_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          details: Json
          host_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json
          host_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json
          host_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
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
          default_turnover_duration_min: number
          description: string | null
          guests: number | null
          host_id: string
          ical_url: string | null
          ical_url_hash: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          max_guests: number | null
          nome: string
          size_sqm: number | null
          status: string | null
          unit_number: string | null
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
          default_turnover_duration_min?: number
          description?: string | null
          guests?: number | null
          host_id: string
          ical_url?: string | null
          ical_url_hash?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          nome?: string
          size_sqm?: number | null
          status?: string | null
          unit_number?: string | null
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
          default_turnover_duration_min?: number
          description?: string | null
          guests?: number | null
          host_id?: string
          ical_url?: string | null
          ical_url_hash?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          nome?: string
          size_sqm?: number | null
          status?: string | null
          unit_number?: string | null
          updated_at?: string | null
          whatsapp_link?: string | null
        }
        Relationships: []
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
      task_checklists: {
        Row: {
          cleaning_task_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          template_id: string | null
        }
        Insert: {
          cleaning_task_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          template_id?: string | null
        }
        Update: {
          cleaning_task_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_checklists_cleaning_task_id_fkey"
            columns: ["cleaning_task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
