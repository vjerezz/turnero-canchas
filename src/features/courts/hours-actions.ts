"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireComplex } from "@/features/auth/session";
import type { AuthState } from "@/features/auth/actions";
import { localTimeSchema, weeklyHoursSchema, type WeeklyWindow } from "./weekly-hours";

export async function saveWeeklyHours(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase, complex } = await requireComplex();
  const id = z.uuid().safeParse(form.get("court_id"));
  const version = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(2147483646)).safeParse(form.get("version"));
  if (!id.success || !version.success) return { message: "Actualizá la página para editar los horarios." };
  const windows: WeeklyWindow[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if (form.get(`enabled_${weekday}`) !== "on") continue;
    const opens = localTimeSchema.safeParse(form.get(`opens_${weekday}`));
    const closes = localTimeSchema.safeParse(form.get(`closes_${weekday}`));
    if (!opens.success || !closes.success) return { message: "Completá apertura y cierre en cada día abierto." };
    windows.push({ weekday, opens_minute: opens.data, closes_minute: closes.data + (form.get(`overnight_${weekday}`) === "on" ? 1440 : 0) });
  }
  const parsed = weeklyHoursSchema.safeParse(windows);
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Revisá los horarios." };
  const { error } = await supabase.rpc("replace_court_weekly_hours", { target_complex: complex.id, target_court: id.data, expected_version: version.data, windows: parsed.data });
  if (error?.code === "40001") return { message: "Otra persona modificó estos horarios. Actualizá la página antes de guardar de nuevo." };
  if (error?.code === "23P01") return { message: "Hay horarios superpuestos entre días consecutivos." };
  if (error) return { message: "No pudimos guardar los horarios. Revisá tu acceso y volvé a intentarlo." };
  revalidatePath(`/admin/canchas/${id.data}/horarios`);
  revalidatePath("/admin/canchas");
  redirect(`/admin/canchas/${id.data}/horarios?guardado=1`);
}
