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
      achievements: {
        Row: {
          awarded_at: string
          code: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          code: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          code?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          game_id: string
          id: string
          message: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          message: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          message?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      games: {
        Row: {
          ai_analysis: Json | null
          ai_difficulty: string | null
          bet: number
          black_player_id: string | null
          created_at: string
          game_mode: string | null
          id: string
          pgn: string | null
          result: string | null
          time_black_ms: number | null
          time_control: string | null
          time_white_ms: number | null
          white_player_id: string | null
          winner_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_difficulty?: string | null
          bet?: number
          black_player_id?: string | null
          created_at?: string
          game_mode?: string | null
          id?: string
          pgn?: string | null
          result?: string | null
          time_black_ms?: number | null
          time_control?: string | null
          time_white_ms?: number | null
          white_player_id?: string | null
          winner_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_difficulty?: string | null
          bet?: number
          black_player_id?: string | null
          created_at?: string
          game_mode?: string | null
          id?: string
          pgn?: string | null
          result?: string | null
          time_black_ms?: number | null
          time_control?: string | null
          time_white_ms?: number | null
          white_player_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          created_at: string
          elo: number
          id: string
          time_control: string
          user_id: string
        }
        Insert: {
          created_at?: string
          elo: number
          id?: string
          time_control: string
          user_id: string
        }
        Update: {
          created_at?: string
          elo?: number
          id?: string
          time_control?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_games_today: number
          avatar_url: string | null
          best_win_streak: number
          board_theme: string
          cb_earned: number
          city: string | null
          company_title: string | null
          corporate_budget: number
          country: string | null
          created_at: string
          current_win_streak: number
          draws: number
          elo_rating: number
          email: string | null
          id: string
          is_pro: boolean
          language: string
          last_ai_game_date: string | null
          last_login_date: string | null
          lessons_completed: Json
          losses: number
          onboarded: boolean
          piece_skin: string
          streak_days: number
          unlocked_skins: Json
          updated_at: string
          username: string | null
          wins: number
          xp: number
        }
        Insert: {
          ai_games_today?: number
          avatar_url?: string | null
          best_win_streak?: number
          board_theme?: string
          cb_earned?: number
          city?: string | null
          company_title?: string | null
          corporate_budget?: number
          country?: string | null
          created_at?: string
          current_win_streak?: number
          draws?: number
          elo_rating?: number
          email?: string | null
          id: string
          is_pro?: boolean
          language?: string
          last_ai_game_date?: string | null
          last_login_date?: string | null
          lessons_completed?: Json
          losses?: number
          onboarded?: boolean
          piece_skin?: string
          streak_days?: number
          unlocked_skins?: Json
          updated_at?: string
          username?: string | null
          wins?: number
          xp?: number
        }
        Update: {
          ai_games_today?: number
          avatar_url?: string | null
          best_win_streak?: number
          board_theme?: string
          cb_earned?: number
          city?: string | null
          company_title?: string | null
          corporate_budget?: number
          country?: string | null
          created_at?: string
          current_win_streak?: number
          draws?: number
          elo_rating?: number
          email?: string | null
          id?: string
          is_pro?: boolean
          language?: string
          last_ai_game_date?: string | null
          last_login_date?: string | null
          lessons_completed?: Json
          losses?: number
          onboarded?: boolean
          piece_skin?: string
          streak_days?: number
          unlocked_skins?: Json
          updated_at?: string
          username?: string | null
          wins?: number
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_ai_game: { Args: { p_limit: number }; Returns: Json }
      place_bet: { Args: { p_amount: number }; Returns: boolean }
      settle_game: {
        Args: { p_bet: number; p_elo_delta: number; p_result: string }
        Returns: undefined
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
