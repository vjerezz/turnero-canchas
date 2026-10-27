"use client";
import Link from "next/link";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { useDemo } from "./context";
import { complexes } from "./fixtures";
import { SearchPage, ComplexPage, ReservePage, RecoverPage, ReservationPage, AccessPage } from "./player";
import { CalendarPage, DashboardPage } from "./admin-calendar";
import { CourtPage, CourtsPage, ClientsPage, ClientPage, TeamPage, SettingsPage, LoginPage, ChooseComplexPage, InvitationPage } from "./admin-management";

type Selection = { cancha?: string; fecha?: string; hora?: string };
export function Prototype({ route, selection }: { route: string; selection: Selection }) {
  const { complex, complexId, setComplexId, role, setRole } = useDemo();
  const isAdmin = route.startsWith("admin");
  const publicTeam = ["admin/ingresar", "admin/recuperar-acceso", "admin/seleccionar-complejo", "admin/invitaciones/aceptar"].includes(route);
  const adminLinks = [
    { href: "/demo/admin/calendario", label: "Calendario" }, { href: "/demo/admin", label: "Panel" }, { href: "/demo/admin/canchas", label: "Canchas" }, { href: "/demo/admin/clientes", label: "Clientes" },
    ...(role === "Propietario" ? [{ href: "/demo/admin/equipo", label: "Equipo" }] : []),
    { href: "/demo/admin/configuracion", label: "Configuración" }, { href: "/demo/admin/seleccionar-complejo", label: "Cambiar complejo" }, { href: "/demo/admin/ingresar", label: "Acceso del equipo" },
  ];
  const playerLinks = [{ href: "/demo", label: "Buscar canchas" }, { href: "/demo/mis-reservas", label: "Mis reservas" }, { href: "/demo/recorridos", label: "Recorridos" }];
  return <AppShell area={isAdmin ? "admin" : "player"} basePath="/demo" navigation={isAdmin && !publicTeam ? adminLinks : playerLinks} context={isAdmin ? `${complex.name} · ${role}` : undefined}>
    <div className="demo-banner"><p><strong>Demo F03</strong> · Datos ficticios. Sin reservas, cobros ni envíos reales.</p><Link href="/demo/recorridos">Ver recorridos</Link></div>
    {isAdmin && !publicTeam && <details className="demo-context"><summary>Contexto de demostración · {complex.name} · {role}</summary><div className="demo-two-col"><Select label="Complejo de demostración" value={complexId} onChange={(event) => { setComplexId(event.target.value); setRole(event.target.value === "alamos" ? "Propietario" : "Administrador"); }}>{complexes.slice(0, 2).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label="Rol de demostración" value={role} onChange={(event) => setRole(event.target.value as "Propietario" | "Administrador")}><option>Propietario</option><option>Administrador</option></Select></div><p className="ui-hint">Controles para revisar vistas. No son autenticación ni permisos reales.</p></details>}
    <Screen key={`${route}-${isAdmin ? complexId : "public"}-${role}`} route={route} selection={selection} />
  </AppShell>;
}

function Screen({ route, selection }: { route: string; selection: Selection }) {
  const parts = route.split("/");
  if (!route) return <SearchPage />;
  if (parts[0] === "complejos") { const complex = complexes.find((item) => item.slug === parts[1])!; return parts[2] === "reservar" ? <ReservePage complex={complex} initialCourt={selection.cancha} initialDate={selection.fecha} initialTime={selection.hora} /> : <ComplexPage complex={complex} />; }
  if (parts[0] === "reservas") return <ReservationPage id={parts[1]} />;
  if (route === "mis-reservas") return <RecoverPage />;
  if (route === "acceso-reserva") return <AccessPage />;
  if (route === "admin") return <DashboardPage />;
  if (route === "admin/calendario") return <CalendarPage />;
  if (route === "admin/canchas") return <CourtsPage />;
  if (parts[1] === "canchas") return <CourtPage id={parts[2]} />;
  if (route === "admin/clientes") return <ClientsPage />;
  if (parts[1] === "clientes") return <ClientPage id={parts[2]} />;
  if (route === "admin/equipo") return <TeamPage />;
  if (route === "admin/configuracion") return <SettingsPage />;
  if (route === "admin/ingresar") return <LoginPage />;
  if (route === "admin/recuperar-acceso") return <RecoverPage team />;
  if (route === "admin/seleccionar-complejo") return <ChooseComplexPage />;
  if (route === "admin/invitaciones/aceptar") return <InvitationPage />;
  return <JourneyIndex />;
}

function JourneyIndex() {
  const groups = [
    { title: "Jugador", links: [["/", "Catálogo y búsqueda"], ["/complejos/los-alamos", "Perfil del complejo"], ["/complejos/los-alamos/reservar", "Reservar como invitado"], ["/reservas/ejemplo", "Solicitud y estados de pago"], ["/mis-reservas", "Recuperar reserva"], ["/acceso-reserva", "Enlace inválido"], ["/reservas/no-autorizada", "Acceso privado denegado"]] },
    { title: "Administración", links: [["/admin", "Panel"], ["/admin/calendario", "Agenda diaria"], ["/admin/canchas", "Canchas"], ["/admin/canchas/alamos-1", "Horarios y tarifas"], ["/admin/clientes", "Clientes"], ["/admin/clientes/c1", "Ficha del cliente"], ["/admin/equipo", "Equipo e invitaciones"], ["/admin/configuracion", "Configuración y cobros"]] },
    { title: "Acceso del equipo", links: [["/admin/ingresar", "Ingreso"], ["/admin/recuperar-acceso", "Recuperación"], ["/admin/seleccionar-complejo", "Selector de complejo"], ["/admin/invitaciones/aceptar", "Aceptar invitación"]] },
  ];
  return <div className="demo-stack"><PageHeader eyebrow="F03 · Prototipo navegable" title="Todos los recorridos" description="Revisá cada pantalla y sus estados. Los cambios son locales y se reinician al recargar." /><div className="demo-results">{groups.map((group) => <Card key={group.title}><h2>{group.title}</h2>{group.links.map(([href, label]) => <Link className="shell-nav-link" href={`/demo${href}`} key={href}>{label} →</Link>)}</Card>)}</div></div>;
}
