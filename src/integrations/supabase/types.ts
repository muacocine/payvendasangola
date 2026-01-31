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
      chat_messages: {
        Row: {
          chuva_amount: number | null
          chuva_claimed_by: string[] | null
          chuva_recipients: number | null
          content: string
          created_at: string | null
          id: string
          is_chuva: boolean | null
          is_deleted: boolean | null
          user_id: string
        }
        Insert: {
          chuva_amount?: number | null
          chuva_claimed_by?: string[] | null
          chuva_recipients?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_chuva?: boolean | null
          is_deleted?: boolean | null
          user_id: string
        }
        Update: {
          chuva_amount?: number | null
          chuva_claimed_by?: string[] | null
          chuva_recipients?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_chuva?: boolean | null
          is_deleted?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_profit: boolean | null
          likes_count: number | null
          profit_amount: number | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_profit?: boolean | null
          likes_count?: number | null
          profit_amount?: number | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_profit?: boolean | null
          likes_count?: number | null
          profit_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_products: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          downloads_count: number | null
          file_url: string | null
          id: string
          price: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          file_url?: string | null
          id?: string
          price?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          file_url?: string | null
          id?: string
          price?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_purchases: {
        Row: {
          amount: number
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pdf_products"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          bonus_balance: number | null
          created_at: string | null
          full_name: string | null
          iban_virtual: string | null
          id: string
          kyc_document_url: string | null
          kyc_selfie_url: string | null
          kyc_status: string | null
          phone: string | null
          pwa_bonus_claimed: boolean | null
          pwa_install_date: string | null
          pwa_installed: boolean | null
          referral_code: string | null
          referral_count: number | null
          referral_earnings: number | null
          referred_by: string | null
          signup_bonus_claimed: boolean | null
          total_profit: number | null
          updated_at: string | null
          user_id: string
          wallet_activated: boolean | null
          wallet_activation_date: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          bonus_balance?: number | null
          created_at?: string | null
          full_name?: string | null
          iban_virtual?: string | null
          id?: string
          kyc_document_url?: string | null
          kyc_selfie_url?: string | null
          kyc_status?: string | null
          phone?: string | null
          pwa_bonus_claimed?: boolean | null
          pwa_install_date?: string | null
          pwa_installed?: boolean | null
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
          signup_bonus_claimed?: boolean | null
          total_profit?: number | null
          updated_at?: string | null
          user_id: string
          wallet_activated?: boolean | null
          wallet_activation_date?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          bonus_balance?: number | null
          created_at?: string | null
          full_name?: string | null
          iban_virtual?: string | null
          id?: string
          kyc_document_url?: string | null
          kyc_selfie_url?: string | null
          kyc_status?: string | null
          phone?: string | null
          pwa_bonus_claimed?: boolean | null
          pwa_install_date?: string | null
          pwa_installed?: boolean | null
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
          signup_bonus_claimed?: boolean | null
          total_profit?: number | null
          updated_at?: string | null
          user_id?: string
          wallet_activated?: boolean | null
          wallet_activation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          commission_earned: number | null
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          activated_at?: string | null
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          activated_at?: string | null
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trades: {
        Row: {
          admin_commission: number | null
          amount: number
          completed_at: string | null
          created_at: string | null
          direction: string
          duration_seconds: number
          entry_price: number
          exit_price: number | null
          id: string
          is_demo: boolean | null
          is_win: boolean | null
          pair: string
          profit_loss: number | null
          user_id: string
        }
        Insert: {
          admin_commission?: number | null
          amount: number
          completed_at?: string | null
          created_at?: string | null
          direction: string
          duration_seconds: number
          entry_price: number
          exit_price?: number | null
          id?: string
          is_demo?: boolean | null
          is_win?: boolean | null
          pair: string
          profit_loss?: number | null
          user_id: string
        }
        Update: {
          admin_commission?: number | null
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          direction?: string
          duration_seconds?: number
          entry_price?: number
          exit_price?: number | null
          id?: string
          is_demo?: boolean | null
          is_win?: boolean | null
          pair?: string
          profit_loss?: number | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          method: string | null
          recipient_user_id: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          method?: string | null
          recipient_user_id?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          method?: string | null
          recipient_user_id?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bans: {
        Row: {
          banned_at: string | null
          banned_by: string
          expires_at: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          banned_at?: string | null
          banned_by: string
          expires_at?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          banned_at?: string | null
          banned_by?: string
          expires_at?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      process_referral_commission: {
        Args: { _profit_amount: number; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
