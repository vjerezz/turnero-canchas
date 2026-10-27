// F03 only: fictitious records, never a production repository or authorization source.
export const DEMO_DATE = "2026-10-24";
export const demoDays = ["2026-10-24", "2026-10-25", "2026-10-26"];
export const demoTimes = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
export type Complex = { id: string; slug: string; name: string; neighborhood: string; address: string; sport: string; price: number; covered: boolean; art: "volt" | "blue" | "ink" };
export const complexes: Complex[] = [
  { id: "alamos", slug: "los-alamos", name: "Complejo Los Álamos", neighborhood: "Palermo", address: "Dirección de demostración · Palermo, CABA", sport: "Fútbol 5", price: 3800000, covered: false, art: "volt" },
  { id: "norte", slug: "club-norte", name: "Club Norte Pádel", neighborhood: "Belgrano", address: "Dirección de demostración · Belgrano, CABA", sport: "Pádel", price: 2600000, covered: true, art: "blue" },
  { id: "terraza", slug: "la-terraza", name: "La Terraza Fútbol", neighborhood: "Villa Crespo", address: "Dirección de demostración · Villa Crespo, CABA", sport: "Fútbol 7", price: 6200000, covered: false, art: "ink" },
  { id: "parque", slug: "cancha-del-parque", name: "Cancha del Parque", neighborhood: "Caballito", address: "Dirección de demostración · Caballito, CABA", sport: "Fútbol 5", price: 3400000, covered: true, art: "blue" },
  { id: "arena", slug: "arena-sur", name: "Arena Sur", neighborhood: "Barracas", address: "Dirección de demostración · Barracas, CABA", sport: "Pádel", price: 2400000, covered: true, art: "ink" },
  { id: "estacion", slug: "estacion-5", name: "Estación 5", neighborhood: "Almagro", address: "Dirección de demostración · Almagro, CABA", sport: "Fútbol 5", price: 3600000, covered: false, art: "volt" },
];
export type Court = { id: string; complexId: string; name: string; sport: string; active: boolean; price: number; covered: boolean };
export const initialCourts: Court[] = complexes.flatMap((complex) => {
  const names = complex.id === "alamos" ? ["Fútbol 5 · A", "Fútbol 5 · B", "Fútbol 7", "Pádel 1", "Pádel 2"] : [`${complex.sport} · 1`, `${complex.sport} · 2`];
  return names.map((name, index) => ({ id: `${complex.id}-${index + 1}`, complexId: complex.id, name, sport: name.startsWith("Pádel") ? "Pádel" : name.startsWith("Fútbol 7") ? "Fútbol 7" : complex.sport, active: true, price: complex.price, covered: complex.covered || name.startsWith("Pádel") }));
});
export type DemoBooking = { id: string; complexId: string; courtId: string; clientId?: string; name: string; date: string; time: string; duration: number; status: "Confirmada" | "Pendiente" | "Bloqueada" | "Finalizada"; amount: number };
export const initialBookings: DemoBooking[] = [
  { id: "r1", complexId: "alamos", courtId: "alamos-1", clientId: "c2", name: "Martín Acosta", date: DEMO_DATE, time: "16:00", duration: 60, status: "Finalizada", amount: 3800000 },
  { id: "r2", complexId: "alamos", courtId: "alamos-2", clientId: "c1", name: "Sofía Ramírez", date: DEMO_DATE, time: "17:00", duration: 60, status: "Confirmada", amount: 3800000 },
  { id: "r3", complexId: "alamos", courtId: "alamos-4", name: "Gonzalo Pérez", date: DEMO_DATE, time: "17:30", duration: 90, status: "Pendiente", amount: 2600000 },
  { id: "r4", complexId: "alamos", courtId: "alamos-1", clientId: "c3", name: "Los Pibes FC", date: DEMO_DATE, time: "18:00", duration: 60, status: "Confirmada", amount: 3800000 },
  { id: "r5", complexId: "alamos", courtId: "alamos-3", name: "Club Ferro", date: DEMO_DATE, time: "18:00", duration: 60, status: "Confirmada", amount: 6200000 },
  { id: "r6", complexId: "alamos", courtId: "alamos-5", name: "Mantenimiento de red", date: DEMO_DATE, time: "16:00", duration: 180, status: "Bloqueada", amount: 0 },
  { id: "r7", complexId: "norte", courtId: "norte-1", clientId: "c4", name: "Julia Costa", date: DEMO_DATE, time: "19:00", duration: 60, status: "Confirmada", amount: 2600000 },
];
export type Client = { id: string; complexId: string; name: string; email: string };
export const initialClients: Client[] = [
  { id: "c1", complexId: "alamos", name: "Sofía Ramírez", email: "sofia@example.com" },
  { id: "c2", complexId: "alamos", name: "Martín Acosta", email: "martin@example.com" },
  { id: "c3", complexId: "alamos", name: "Los Pibes FC", email: "equipo@example.com" },
  { id: "c4", complexId: "norte", name: "Julia Costa", email: "julia@example.com" },
];
export type Member = { id: string; complexId: string; name: string; email: string; role: "Propietario" | "Administrador"; status: "Activo" | "Invitado" };
export const initialMembers: Member[] = [
  { id: "m1", complexId: "alamos", name: "Alex Demo", email: "alex@example.com", role: "Propietario", status: "Activo" },
  { id: "m2", complexId: "alamos", name: "Camila Demo", email: "camila@example.com", role: "Administrador", status: "Activo" },
  { id: "m3", complexId: "norte", name: "Alex Demo", email: "alex@example.com", role: "Administrador", status: "Activo" },
];
export function money(cents: number) { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(cents / 100); }
export function minutes(time: string) { const [hours, mins] = time.split(":").map(Number); return hours * 60 + mins; }
export function endTime(time: string, duration = 60) { const total = minutes(time) + duration; return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }
export function dateLabel(date: string) { const [year, month, day] = date.split("-").map(Number); return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day))); }
export function availableTimes(courtId: string, date: string, bookings: DemoBooking[]) {
  return demoTimes.filter((time) => !bookings.some((booking) => booking.courtId === courtId && booking.date === date && booking.status !== "Finalizada" && minutes(time) < minutes(booking.time) + booking.duration && minutes(time) + 60 > minutes(booking.time)));
}

