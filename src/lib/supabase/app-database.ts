import type { Database } from "./database.types";

// Contrato local escrito a mano para las migraciones de canchas y horarios.
// Sustituir por tipos generados desde Supabase al aplicar la migración.
export type CourtRow = {
  id: string; complex_id: string; name: string; sport: "football-5" | "football-6" | "padel";
  duration_minutes: number; price_in_cents: number; currency: string; active: boolean; created_at: string; hours_version: number;
};
export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      replace_court_weekly_hours: { Args: { target_complex: string; target_court: string; expected_version: number; windows: import("./database.types").Json }; Returns: undefined };
    };
    Tables: Database["public"]["Tables"] & {
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
