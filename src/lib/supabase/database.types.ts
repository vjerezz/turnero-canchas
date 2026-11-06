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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      complexes: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      court_date_exceptions: {
        Row: {
          active: boolean
          closed: boolean
          closes_minute: number | null
          complex_id: string
          court_id: string
          opens_minute: number | null
          service_date: string
        }
        Insert: {
          active?: boolean
          closed: boolean
          closes_minute?: number | null
          complex_id: string
          court_id: string
          opens_minute?: number | null
          service_date: string
        }
        Update: {
          active?: boolean
          closed?: boolean
          closes_minute?: number | null
          complex_id?: string
          court_id?: string
          opens_minute?: number | null
          service_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "court_date_exceptions_complex_id_court_id_fkey"
            columns: ["complex_id", "court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["complex_id", "id"]
          },
        ]
      }
      court_occupancies: {
        Row: {
          active: boolean
          complex_id: string
          court_id: string
          ends_at: string
          id: string
          kind: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          complex_id: string
          court_id: string
          ends_at: string
          id?: string
          kind: string
          starts_at: string
        }
        Update: {
          active?: boolean
          complex_id?: string
          court_id?: string
          ends_at?: string
          id?: string
          kind?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "court_occupancies_complex_id_court_id_fkey"
            columns: ["complex_id", "court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["complex_id", "id"]
          },
        ]
      }
      court_weekly_hours: {
        Row: {
          closes_minute: number
          complex_id: string
          court_id: string
          opens_minute: number
          weekday: number
        }
        Insert: {
          closes_minute: number
          complex_id: string
          court_id: string
          opens_minute: number
          weekday: number
        }
        Update: {
          closes_minute?: number
          complex_id?: string
          court_id?: string
          opens_minute?: number
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "court_weekly_hours_complex_id_court_id_fkey"
            columns: ["complex_id", "court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["complex_id", "id"]
          },
        ]
      }
      courts: {
        Row: {
          active: boolean
          complex_id: string
          created_at: string
          currency: string
          duration_minutes: number | null
          hours_version: number
          id: string
          name: string
          price_in_cents: number
          sport: string
        }
        Insert: {
          active?: boolean
          complex_id: string
          created_at?: string
          currency?: string
          duration_minutes?: number | null
          hours_version?: number
          id?: string
          name: string
          price_in_cents: number
          sport: string
        }
        Update: {
          active?: boolean
          complex_id?: string
          created_at?: string
          currency?: string
          duration_minutes?: number | null
          hours_version?: number
          id?: string
          name?: string
          price_in_cents?: number
          sport?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          complex_id: string
          created_at: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
        }
        Insert: {
          complex_id: string
          created_at?: string
          revoked_at?: string | null
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
        }
        Update: {
          complex_id?: string
          created_at?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_events: {
        Row: {
          complex_id: string
          event: string
          id: string
          occurred_at: string
          reservation_id: string
        }
        Insert: {
          complex_id: string
          event: string
          id?: string
          occurred_at: string
          reservation_id: string
        }
        Update: {
          complex_id?: string
          event?: string
          id?: string
          occurred_at?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_events_complex_id_reservation_id_fkey"
            columns: ["complex_id", "reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["complex_id", "id"]
          },
        ]
      }
      reservations: {
        Row: {
          complex_id: string
          court_id: string
          created_at: string
          created_by: string
          currency: string
          customer_email: string
          customer_name: string
          deposit_in_cents: number
          deposit_percent: number
          duration_minutes: number
          expires_at: string
          hold_minutes: number
          id: string
          request_id: string
          service_date: string
          start_minute: number
          status: string
          total_in_cents: number
        }
        Insert: {
          complex_id: string
          court_id: string
          created_at: string
          created_by: string
          currency?: string
          customer_email: string
          customer_name: string
          deposit_in_cents: number
          deposit_percent?: number
          duration_minutes: number
          expires_at: string
          hold_minutes?: number
          id: string
          request_id: string
          service_date: string
          start_minute: number
          status?: string
          total_in_cents: number
        }
        Update: {
          complex_id?: string
          court_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          deposit_in_cents?: number
          deposit_percent?: number
          duration_minutes?: number
          expires_at?: string
          hold_minutes?: number
          id?: string
          request_id?: string
          service_date?: string
          start_minute?: number
          status?: string
          total_in_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_complex_id_court_id_id_fkey"
            columns: ["complex_id", "court_id", "id"]
            isOneToOne: false
            referencedRelation: "court_occupancies"
            referencedColumns: ["complex_id", "court_id", "id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          complex_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          complex_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          revoked_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          complex_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { invitation_token: string }
        Returns: string
      }
      bootstrap_complex: {
        Args: {
          complex_name: string
          complex_slug: string
          operator_reference: string
          owner_id: string
        }
        Returns: string
      }
      create_quoted_team_reservation: {
        Args: {
          expected_total: number
          guest_email: string
          guest_name: string
          idempotency_key: string
          target_complex: string
          target_court: string
          target_date: string
          target_minute: number
        }
        Returns: {
          complex_id: string
          court_id: string
          created_at: string
          created_by: string
          currency: string
          customer_email: string
          customer_name: string
          deposit_in_cents: number
          deposit_percent: number
          duration_minutes: number
          expires_at: string
          hold_minutes: number
          id: string
          request_id: string
          service_date: string
          start_minute: number
          status: string
          total_in_cents: number
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_team_reservation: {
        Args: {
          guest_email: string
          guest_name: string
          idempotency_key: string
          target_complex: string
          target_court: string
          target_date: string
          target_minute: number
        }
        Returns: {
          complex_id: string
          court_id: string
          created_at: string
          created_by: string
          currency: string
          customer_email: string
          customer_name: string
          deposit_in_cents: number
          deposit_percent: number
          duration_minutes: number
          expires_at: string
          hold_minutes: number
          id: string
          request_id: string
          service_date: string
          start_minute: number
          status: string
          total_in_cents: number
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_team_availability: {
        Args: {
          target_complex: string
          target_court: string
          target_date: string
        }
        Returns: Json
      }
      invite_administrator: {
        Args: { recipient_email: string; target_complex: string }
        Returns: {
          invitation_id: string
          invitation_token: string
        }[]
      }
      replace_court_weekly_hours: {
        Args: {
          expected_version: number
          target_complex: string
          target_court: string
          windows: Json
        }
        Returns: undefined
      }
      revoke_administrator: {
        Args: { target_complex: string; target_user: string }
        Returns: undefined
      }
      revoke_team_invitation: {
        Args: { target_complex: string; target_invitation: string }
        Returns: undefined
      }
    }
    Enums: {
      team_role: "owner" | "admin"
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
      team_role: ["owner", "admin"],
    },
  },
} as const
