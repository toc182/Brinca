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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accolade_unlocks: {
        Row: {
          accolade_id: string
          child_id: string
          unlocked_at: string
        }
        Insert: {
          accolade_id: string
          child_id: string
          unlocked_at?: string
        }
        Update: {
          accolade_id?: string
          child_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accolade_unlocks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          category: string | null
          child_id: string
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          child_id: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          child_id?: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_presets: {
        Row: {
          amount: number
          created_at: string
          display_order: number
          id: string
          parent_id: string
          parent_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          display_order?: number
          id?: string
          parent_id: string
          parent_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          display_order?: number
          id?: string
          parent_id?: string
          parent_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          avatar_url: string | null
          calendar_end_month: number | null
          calendar_start_month: number | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          family_id: string
          gender: string | null
          grade_level: string | null
          id: string
          name: string
          school_calendar: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          calendar_end_month?: number | null
          calendar_start_month?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          family_id: string
          gender?: string | null
          grade_level?: string | null
          id?: string
          name: string
          school_calendar?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          calendar_end_month?: number | null
          calendar_start_month?: number | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          family_id?: string
          gender?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          school_calendar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_ledger: {
        Row: {
          amount: number
          child_id: string
          created_at: string
          id: string
          reason: string | null
          reference_id: string | null
          source: string
        }
        Insert: {
          amount: number
          child_id: string
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          source: string
        }
        Update: {
          amount?: number
          child_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "currency_ledger_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_results: {
        Row: {
          created_at: string
          drill_id: string
          id: string
          is_complete: boolean
          note: string | null
          photo_url: string | null
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          drill_id: string
          id?: string
          is_complete?: boolean
          note?: string | null
          photo_url?: string | null
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          drill_id?: string
          id?: string
          is_complete?: boolean
          note?: string | null
          photo_url?: string | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_results_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      drills: {
        Row: {
          activity_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drills_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      element_values: {
        Row: {
          created_at: string
          drill_result_id: string
          id: string
          tracking_element_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          drill_result_id: string
          id?: string
          tracking_element_id: string
          value?: Json
        }
        Update: {
          created_at?: string
          drill_result_id?: string
          id?: string
          tracking_element_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "element_values_drill_result_id_fkey"
            columns: ["drill_result_id"]
            isOneToOne: false
            referencedRelation: "drill_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "element_values_tracking_element_id_fkey"
            columns: ["tracking_element_id"]
            isOneToOne: false
            referencedRelation: "tracking_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      external_activities: {
        Row: {
          child_id: string
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          schedule: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          schedule?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          schedule?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_activities_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          currency_name: string
          id: string
          measurement_unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_name?: string
          id?: string
          measurement_unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_name?: string
          id?: string
          measurement_unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          family_id: string
          id: string
          invited_by: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          family_id: string
          id?: string
          invited_by: string
          role: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          family_id?: string
          id?: string
          invited_by?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          child_id: string
          created_at: string
          date: string
          id: string
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          child_id: string
          created_at?: string
          date: string
          id?: string
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          id?: string
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          persona_type: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          persona_type?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          persona_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          child_id: string
          cost: number
          created_at: string
          id: string
          name: string
          redeemed_at: string | null
          state: string
        }
        Insert: {
          child_id: string
          cost: number
          created_at?: string
          id?: string
          name: string
          redeemed_at?: string | null
          state?: string
        }
        Update: {
          child_id?: string
          cost?: number
          created_at?: string
          id?: string
          name?: string
          redeemed_at?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          activity_id: string
          child_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_complete: boolean
          note: string | null
          photo_url: string | null
          started_at: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          child_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_complete?: boolean
          note?: string | null
          photo_url?: string | null
          started_at: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          child_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_complete?: boolean
          note?: string | null
          photo_url?: string | null
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_rewards: {
        Row: {
          conditions: Json
          created_at: string
          currency_amount: number
          display_order: number
          id: string
          name: string
          parent_id: string
          parent_type: string
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          currency_amount?: number
          display_order?: number
          id?: string
          name: string
          parent_id: string
          parent_type: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          currency_amount?: number
          display_order?: number
          id?: string
          name?: string
          parent_id?: string
          parent_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracking_elements: {
        Row: {
          config: Json
          created_at: string
          display_order: number
          drill_id: string
          id: string
          label: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_order?: number
          drill_id: string
          id?: string
          label: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_order?: number
          drill_id?: string
          id?: string
          label?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_elements_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_family_role: { Args: { p_family_id: string }; Returns: string }
      has_write_access: { Args: { p_family_id: string }; Returns: boolean }
      is_admin_or_coadmin: { Args: { p_family_id: string }; Returns: boolean }
      is_family_member: { Args: { p_family_id: string }; Returns: boolean }
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
