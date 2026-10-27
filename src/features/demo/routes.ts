import { complexes } from "./fixtures";

export const demoRoutes = ["", "recorridos", "mis-reservas", "acceso-reserva", "admin", "admin/calendario", "admin/canchas", "admin/clientes", "admin/equipo", "admin/configuracion", "admin/ingresar", "admin/recuperar-acceso", "admin/seleccionar-complejo", "admin/invitaciones/aceptar"];
export function isDemoRoute(route: string) {
  if (demoRoutes.includes(route)) return true;
  const parts = route.split("/");
  if (parts[0] === "complejos") return complexes.some((complex) => complex.slug === parts[1]) && (parts.length === 2 || (parts.length === 3 && parts[2] === "reservar"));
  return /^reservas\/[^/]+$/.test(route) || /^admin\/(canchas|clientes)\/[^/]+$/.test(route);
}
