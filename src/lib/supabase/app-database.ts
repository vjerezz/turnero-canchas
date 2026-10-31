import type { Database } from "./database.types";

// Contrato local escrito a mano para las migraciones de canchas, horarios y reservas.
// Sustituir por tipos generados desde Supabase al aplicar la migración.
export type CourtRow = {
  id: string; complex_id: string; name: string; sport: "football-5" | "football-6" | "padel";
  duration_minutes: number; price_in_cents: number; currency: string; active: boolean; created_at: string; hours_version: number;
};
export type ReservationRow = {
  id: string; complex_id: string; court_id: string; service_date: string; start_minute: number;
  customer_name: string; customer_email: string; status: "pending_deposit" | "confirmed" | "expired";
  total_in_cents: number; deposit_in_cents: number; deposit_percent: number; hold_minutes: number;
  currency: string; duration_minutes: number; created_at: string; expires_at: string;
  created_by: string; request_id: string;
};
export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      create_team_reservation: {
        Args: { target_complex: string; target_court: string; target_date: string; target_minute: number; guest_name: string; guest_email: string; idempotency_key: string };
        Returns: ReservationRow;
      };
      replace_court_weekly_hours: { Args: { target_complex: string; target_court: string; expected_version: number; windows: import("./database.types").Json }; Returns: undefined };
    };
    Tables: Database["public"]["Tables"] & {
      reservations: { Row: ReservationRow; Insert: never; Update: never; Relationships: [] };
      court_occupancies: {
        Row: { id: string; complex_id: string; court_id: string; kind: "reservation" | "block"; starts_at: string; ends_at: string; active: boolean };
        Insert: never; Update: never; Relationships: [];
      };
      reservation_events: {
        Row: { id: string; reservation_id: string; complex_id: string; event: "created" | "expired"; occurred_at: string };
        Insert: never; Update: never; Relationships: [];
      };
      court_date_exceptions: {
        Row: import("@/features/courts/date-exceptions").DateException & { complex_id: string; court_id: string; active: boolean };
        Insert: import("@/features/courts/date-exceptions").DateException & { complex_id: string; court_id: string };
        Update: Partial<Pick<import("@/features/courts/date-exceptions").DateException, "closed" | "opens_minute" | "closes_minute"> & { active: boolean }>;
        Relationships: [];
      };
      court_weekly_hours: {
        Row: { complex_id: string; court_id: string; weekday: number; opens_minute: number; closes_minute: number };
        Insert: never; Update: never; Relationships: [];
      };
      courts: {
        Row: CourtRow;
        Insert: Pick<CourtRow, "complex_id" | "name" | "sport" | "price_in_cents">;
        Update: Partial<Pick<CourtRow, "name" | "sport" | "price_in_cents" | "active">>;
        Relationships: [{ foreignKeyName: "courts_complex_id_fkey"; columns: ["complex_id"]; isOneToOne: false; referencedRelation: "complexes"; referencedColumns: ["id"] }];
      };
    };
  };
};
