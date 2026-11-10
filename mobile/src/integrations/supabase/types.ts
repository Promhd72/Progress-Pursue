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
      advanced_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_index?: number
          user_id?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string
          expires_at: string | null
          grants_pro: boolean
          id: string
          max_redemptions: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string
          expires_at?: string | null
          grants_pro?: boolean
          id?: string
          max_redemptions?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expires_at?: string | null
          grants_pro?: boolean
          id?: string
          max_redemptions?: number | null
        }
        Relationships: []
      }
      drill_sessions: {
        Row: {
          avg_ms_per_question: number
          correct: number
          created_at: string
          difficulty: string
          duration_ms: number
          id: string
          total_questions: number
          type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          avg_ms_per_question: number
          correct: number
          created_at?: string
          difficulty: string
          duration_ms: number
          id?: string
          total_questions: number
          type: string
          user_id: string
          xp_earned: number
        }
        Update: {
          avg_ms_per_question?: number
          correct?: number
          created_at?: string
          difficulty?: string
          duration_ms?: number
          id?: string
          total_questions?: number
          type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      lesson_attempts: {
        Row: {
          correct: number
          created_at: string
          duration_ms: number
          id: string
          level: number
          passed: boolean
          total: number
          track: Database["public"]["Enums"]["skill_track"]
          user_id: string
          xp_earned: number
        }
        Insert: {
          correct: number
          created_at?: string
          duration_ms: number
          id?: string
          level: number
          passed: boolean
          total: number
          track: Database["public"]["Enums"]["skill_track"]
          user_id: string
          xp_earned?: number
        }
        Update: {
          correct?: number
          created_at?: string
          duration_ms?: number
          id?: string
          level?: number
          passed?: boolean
          total?: number
          track?: Database["public"]["Enums"]["skill_track"]
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      placement_results: {
        Row: {
          created_at: string
          id: string
          per_skill: Json
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          per_skill?: Json
          score: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          per_skill?: Json
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number
          email: string
          id: string
          is_pro: boolean
          last_active_date: string | null
          longest_streak: number
          name: string
          onboarding_completed: boolean
          pro_source: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          email?: string
          id: string
          is_pro?: boolean
          last_active_date?: string | null
          longest_streak?: number
          name?: string
          onboarding_completed?: boolean
          pro_source?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          email?: string
          id?: string
          is_pro?: boolean
          last_active_date?: string | null
          longest_streak?: number
          name?: string
          onboarding_completed?: boolean
          pro_source?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      track_progress: {
        Row: {
          current_level: number
          highest_level_passed: number
          id: string
          track: Database["public"]["Enums"]["skill_track"]
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number
          highest_level_passed?: number
          id?: string
          track: Database["public"]["Enums"]["skill_track"]
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number
          highest_level_passed?: number
          id?: string
          track?: Database["public"]["Enums"]["skill_track"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_account: { Args: never; Returns: undefined }
      redeem_coupon: { Args: { p_code: string }; Returns: Json }
      submit_advanced_attempt: {
        Args: { p_is_correct: boolean; p_question_id: string; p_selected_index: number }
        Returns: Json
      }
      submit_lesson: {
        Args: {
          p_correct: number
          p_duration_ms: number
          p_level: number
          p_total: number
          p_track: string
        }
        Returns: Json
      }
      submit_placement: {
        Args: { p_per_skill: Json; p_total: number; p_total_correct: number }
        Returns: Json
      }
    }
    Enums: {
      skill_track:
        | "addition"
        | "subtraction"
        | "multiplication"
        | "division"
        | "percentage"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      skill_track: [
        "addition",
        "subtraction",
        "multiplication",
        "division",
        "percentage",
      ],
    },
  },
} as const
