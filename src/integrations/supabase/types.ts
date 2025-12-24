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
      cart_items: {
        Row: {
          created_at: string
          id: string
          price: number
          product_name: string
          product_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          product_name: string
          product_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          product_name?: string
          product_type?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_answer_keys: {
        Row: {
          correct_answer: number
          created_at: string
          exam_name: string
          exam_round: number
          id: string
          question_number: number
          subject: Database["public"]["Enums"]["exam_subject"]
        }
        Insert: {
          correct_answer: number
          created_at?: string
          exam_name: string
          exam_round: number
          id?: string
          question_number: number
          subject: Database["public"]["Enums"]["exam_subject"]
        }
        Update: {
          correct_answer?: number
          created_at?: string
          exam_name?: string
          exam_round?: number
          id?: string
          question_number?: number
          subject?: Database["public"]["Enums"]["exam_subject"]
        }
        Relationships: []
      }
      exam_numbers: {
        Row: {
          batch_name: string
          created_at: string
          exam_number: string
          id: string
          is_used: boolean
          used_at: string | null
        }
        Insert: {
          batch_name: string
          created_at?: string
          exam_number: string
          id?: string
          is_used?: boolean
          used_at?: string | null
        }
        Update: {
          batch_name?: string
          created_at?: string
          exam_number?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_important: boolean
          title: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_important?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_important?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          buyer_email: string
          buyer_name: string
          buyer_phone: string
          created_at: string
          exam_number: string | null
          id: string
          order_id: string
          paid_at: string | null
          payment_key: string | null
          product_name: string
          refund_reason: string | null
          refunded_at: string | null
          shipping_address: string
          shipping_detail_address: string | null
          shipping_postal_code: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          buyer_email: string
          buyer_name: string
          buyer_phone: string
          created_at?: string
          exam_number?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          payment_key?: string | null
          product_name: string
          refund_reason?: string | null
          refunded_at?: string | null
          shipping_address: string
          shipping_detail_address?: string | null
          shipping_postal_code: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          exam_number?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_key?: string | null
          product_name?: string
          refund_reason?: string | null
          refunded_at?: string | null
          shipping_address?: string
          shipping_detail_address?: string | null
          shipping_postal_code?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scoring_answers: {
        Row: {
          correct_answer: number
          created_at: string
          id: string
          is_correct: boolean
          question_number: number
          scoring_result_id: string
          user_answer: number
        }
        Insert: {
          correct_answer: number
          created_at?: string
          id?: string
          is_correct: boolean
          question_number: number
          scoring_result_id: string
          user_answer: number
        }
        Update: {
          correct_answer?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          question_number?: number
          scoring_result_id?: string
          user_answer?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_answers_scoring_result_id_fkey"
            columns: ["scoring_result_id"]
            isOneToOne: false
            referencedRelation: "scoring_results"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_results: {
        Row: {
          correct_count: number
          created_at: string
          exam_name: string
          exam_number_id: string | null
          exam_round: number
          id: string
          score_percentage: number
          subject: string
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_count: number
          created_at?: string
          exam_name: string
          exam_number_id?: string | null
          exam_round: number
          id?: string
          score_percentage: number
          subject: string
          total_questions: number
          user_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          exam_name?: string
          exam_number_id?: string | null
          exam_round?: number
          id?: string
          score_percentage?: number
          subject?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_results_exam_number_id_fkey"
            columns: ["exam_number_id"]
            isOneToOne: false
            referencedRelation: "exam_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      exam_subject: "financial_accounting" | "tax_law"
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
      app_role: ["admin", "moderator", "user"],
      exam_subject: ["financial_accounting", "tax_law"],
    },
  },
} as const
