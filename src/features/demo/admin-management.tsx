"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/app-shell";
import { Back, BookingBadge, CourtArt, DemoLink, PreviewState } from "./common";
import { useDemo } from "./context";
import { complexes, DEMO_DATE, dateLabel, money, type Court, type Client } from "./fixtures";

export function CourtsPage() {
  const { courts, complexId } = useDemo();
  return <div className="demo-stack"><PageHeader eyebrow="Configuración operativa" title="Tus canchas" description="Organizá los espacios de tu complejo." action={<DemoLink href="/admin/canchas/nueva">Agregar cancha</DemoLink>} /><PreviewState><div className="demo-results admin-court-grid">{courts.filter((court) => court.complexId === complexId).map((court) => <Card key={court.id} className="complex-card"><CourtArt variant={court.sport === "Pádel" ? "blue" : "volt"} padel={court.sport === "Pádel"} /><div className="complex-card-body"><div className="demo-section-heading"><h2>{court.name}</h2><Badge tone={court.active ? "success" : "neutral"}>{court.active ? "Activa" : "Inactiva"}</Badge></div><p>{court.sport} · {court.covered ? "Techada" : "Descubierta"}</p><p className="demo-price">{money(court.price)} <small>tarifa de ejemplo</small></p><DemoLink secondary href={`/admin/canchas/${court.id}`}>Editar y ver horarios</DemoLink></div></Card>)}</div></PreviewState></div>;
}

export function CourtPage({ id }: { id: string }) {
  const { complexId, courts, setCourts } = useDemo();
  const existing = courts.find((court) => court.id === id && court.complexId === complexId);
  const [name, setName] = useState(existing?.name ?? "");
  const [sport, setSport] = useState(existing?.sport ?? "Fútbol 5");
  const [active, setActive] = useState(existing?.active ?? true);
  const [covered, setCovered] = useState(existing?.covered ?? false);
  const [price, setPrice] = useState(String((existing?.price ?? 3800000) / 100));
  const [from, setFrom] = useState("16:00"); const [to, setTo] = useState("23:00");
  const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  const router = useRouter();
  if (!existing && id !== "nueva") return <MissingRecord />;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !/^\d{1,7}$/.test(price) || Number(price) <= 0 || from >= to) { setError("Completá un nombre, un importe entero positivo y un horario de cierre posterior a la apertura."); return; }
    const court: Court = { id: existing?.id ?? `court-${crypto.randomUUID()}`, complexId, name: name.trim(), sport, active, covered, price: Number(price) * 100 };
    setCourts((current) => existing ? current.map((item) => item.id === existing.id && item.complexId === complexId ? court : item) : [...current, court]);
    setError(""); setSaved(true);
    if (!existing) router.push("/demo/admin/canchas");
  }
  return <div className="demo-stack"><Back href="/admin/canchas">Todas las canchas</Back><PageHeader eyebrow="Cancha · horarios · tarifas" title={existing ? existing.name : "Agregá una cancha"} description="Edición de demostración. Los cambios de cancha duran hasta recargar la página." /><form noValidate onSubmit={submit} className="demo-two-col"><Card><h2>Datos de la cancha</h2><Input label="Nombre de la cancha" value={name} onChange={(event) => setName(event.target.value)} required /><Select label="Deporte de la cancha" value={sport} onChange={(event) => setSport(event.target.value)}>{["Fútbol 5", "Fútbol 7", "Pádel"].map((item) => <option key={item}>{item}</option>)}</Select><Select label="Superficie cubierta" value={String(covered)} onChange={(event) => setCovered(event.target.value === "true")}><option value="false">Descubierta</option><option value="true">Techada</option></Select><Select label="Estado de la cancha" value={String(active)} onChange={(event) => setActive(event.target.value === "true")}><option value="true">Activa</option><option value="false">Inactiva</option></Select><p className="ui-hint">Desactivar oculta la cancha del selector público de la demo y conserva su historial.</p></Card><Card><h2>Horarios y tarifa de ejemplo</h2><div className="ui-row"><Badge>Lun a dom · ejemplo</Badge><Badge>America/Argentina/Buenos_Aires</Badge></div><Input label="Apertura" type="time" value={from} onChange={(event) => setFrom(event.target.value)} /><Input label="Cierre" type="time" value={to} onChange={(event) => setTo(event.target.value)} /><Input label="Tarifa ilustrativa en ARS (sin centavos)" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} /><Alert title="Vista previa de reglas">Apertura y cierre se muestran para revisar el formulario; no recalculan disponibilidad. Vigencias, excepciones, duración y seña se definirán antes de conectar el motor de reservas.</Alert></Card><div className="ui-stack">{error && <Alert role="alert" tone="error" title="Revisá los datos">{error}</Alert>}{saved && <Alert role="status" tone="success" title="Cancha de ejemplo actualizada">Los datos visuales se actualizaron en esta sesión. Horarios mostrados: {from} – {to}.</Alert>}<Button type="submit">Guardar cancha de ejemplo</Button></div></form></div>;
}

function ClientEditor() {
  const { complexId, setClients } = useDemo();
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [error, setError] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Ingresá un nombre y un email válido."); return; } setClients((current) => [...current, { id: `client-${crypto.randomUUID()}`, complexId, name: name.trim(), email }]); setOpen(false); setName(""); setEmail(""); setError(""); }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus aria-hidden="true" />Agregar cliente</Button></DialogTrigger><DialogContent><DialogTitle>Cliente de demostración</DialogTitle><DialogDescription>Usá datos ficticios. Esta ficha pertenece solo al complejo actual.</DialogDescription><form onSubmit={submit} noValidate className="ui-stack"><Input label="Nombre del cliente" value={name} onChange={(event) => setName(event.target.value)} required /><Input label="Email del cliente" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />{error && <Alert role="alert" tone="error" title="Revisá los datos">{error}</Alert>}<Button type="submit">Agregar ejemplo</Button></form></DialogContent></Dialog>;
}

export function ClientsPage() {
  const { clients, complexId } = useDemo(); const [search, setSearch] = useState("");
  const results = clients.filter((client) => client.complexId === complexId && `${client.name} ${client.email}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="demo-stack"><PageHeader eyebrow="Ficha comercial del complejo" title="Clientes" description="Cada complejo conserva su propio historial." action={<ClientEditor />} /><Input label="Buscar cliente" placeholder="Nombre o email" value={search} onChange={(event) => setSearch(event.target.value)} /><PreviewState><Card><div className="data-list-header"><strong>Cliente</strong><strong>Contacto</strong><span>Ficha</span></div>{results.map((client) => <div className="data-list-row" key={client.id}><strong>{client.name}</strong><span>{client.email}</span><DemoLink secondary href={`/admin/clientes/${client.id}`}>Ver ficha</DemoLink></div>)}{!results.length && <EmptyState title="No encontramos ese cliente">Cambiá la búsqueda o agregá un ejemplo.</EmptyState>}</Card></PreviewState></div>;
}

export function ClientPage({ id }: { id: string }) {
  const { clients, complexId, bookings } = useDemo(); const client = clients.find((item) => item.id === id && item.complexId === complexId);
  if (!client) return <MissingRecord />;
  const records = bookings.filter((item) => item.complexId === complexId && item.clientId === client.id);
  return <div className="demo-stack"><Back href="/admin/clientes">Clientes</Back><PageHeader eyebrow="Ficha de ejemplo" title={client.name} description="Datos ficticios, visibles solo en el contexto de esta demostración." /><div className="demo-two-col"><Card><h2>Contacto</h2><p>{client.email}</p><Badge>Cliente del complejo actual</Badge><EditClient client={client} /><Alert title="Historial independiente">No se comparten reservas de otros complejos.</Alert></Card><Card><h2>Historial de ejemplo</h2>{records.length ? records.map((booking) => <div className="ui-stack" key={booking.id}><p>{dateLabel(booking.date)} · {booking.time}</p><BookingBadge status={booking.status} /><strong>{money(booking.amount)}</strong></div>) : <EmptyState title="Sin turnos registrados">La ficha todavía no tiene reservas de ejemplo.</EmptyState>}</Card></div></div>;
}

function EditClient({ client }: { client: Client }) {
  const { complexId, setClients } = useDemo();
  const [open, setOpen] = useState(false); const [name, setName] = useState(client.name); const [email, setEmail] = useState(client.email); const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Completá el nombre y un email válido."); return; }
    setClients((current) => current.map((item) => item.id === client.id && item.complexId === complexId ? { ...item, name: name.trim(), email } : item)); setOpen(false); setError("");
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="secondary">Editar ficha de ejemplo</Button></DialogTrigger><DialogContent><DialogTitle>Editar cliente</DialogTitle><DialogDescription>Solo cambia la ficha ficticia. No modifica el acceso privado de ninguna reserva.</DialogDescription><form className="ui-stack" onSubmit={submit} noValidate><Input label="Nombre del cliente" value={name} onChange={(event) => setName(event.target.value)} /><Input label="Email del cliente" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />{error && <Alert role="alert" tone="error" title="Revisá los datos">{error}</Alert>}<Button type="submit">Guardar ficha de ejemplo</Button></form></DialogContent></Dialog>;
}

export function TeamPage() {
  const { complexId, role, members, setMembers } = useDemo(); const [email, setEmail] = useState(""); const [message, setMessage] = useState("");
  if (role !== "Propietario") return <OwnerOnly />;
  function invite(event: FormEvent) { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage("Ingresá un email válido."); return; } if (members.some((member) => member.complexId === complexId && member.email.toLowerCase() === email.toLowerCase())) { setMessage("Ese email ya está en el equipo de ejemplo."); return; } setMembers((current) => [...current, { id: `member-${crypto.randomUUID()}`, complexId, name: "Invitación de ejemplo", email, role: "Administrador", status: "Invitado" }]); setMessage("Invitación agregada a la demo. No se envió ningún email."); setEmail(""); }
  return <div className="demo-stack"><PageHeader eyebrow="Solo propietario" title="Equipo del complejo" description="Invitá administradores y revisá quién forma parte de tu equipo." /><PreviewState><div className="demo-two-col"><Card><h2>Miembros</h2>{members.filter((member) => member.complexId === complexId).map((member) => <div className="team-member" key={member.id}><div className="ui-stack"><strong>{member.name}</strong><p>{member.email}</p><div className="ui-row"><Badge>{member.role}</Badge><Badge tone={member.status === "Activo" ? "success" : "warning"}>{member.status}</Badge></div></div>{member.role !== "Propietario" && <Dialog><DialogTrigger asChild><Button variant="secondary">Revocar ejemplo</Button></DialogTrigger><DialogContent><DialogTitle>¿Quitar este miembro de la demo?</DialogTitle><DialogDescription>{member.email} dejará de aparecer en el equipo de ejemplo. No cambia permisos reales.</DialogDescription><DialogClose asChild><Button variant="destructive" onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))}>Confirmar revocación de ejemplo</Button></DialogClose></DialogContent></Dialog>}</div>)}</Card><Card><h2>Invitar administrador</h2><form onSubmit={invite} noValidate className="ui-stack"><Input label="Email a invitar" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><p>Rol de la invitación: administrador.</p><Button type="submit">Simular invitación</Button>{message && <p role="status">{message}</p>}</form><DemoLink secondary href="/admin/invitaciones/aceptar">Ver aceptación de ejemplo</DemoLink></Card></div></PreviewState></div>;
}

export function SettingsPage() {
  const { complex, role } = useDemo(); const [name, setName] = useState(complex.name); const [address, setAddress] = useState(complex.address); const [status, setStatus] = useState("disconnected"); const [saved, setSaved] = useState(false);
  const owner = role === "Propietario";
  return <div className="demo-stack"><PageHeader eyebrow="Tu complejo" title="Configuración" description="Perfil público y cuenta de cobro del complejo." /><div className="demo-two-col"><Card><h2>Perfil público</h2><form className="ui-stack" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}><Input label="Nombre público" value={name} onChange={(event) => setName(event.target.value)} required disabled={!owner} /><Input label="Dirección pública" value={address} onChange={(event) => setAddress(event.target.value)} required disabled={!owner} /><Input label="Enlace propio" readOnly value={`/complejos/${complex.slug}`} /><DemoLink secondary href={`/complejos/${complex.slug}`}>Ver perfil de ejemplo</DemoLink>{owner ? <Button type="submit">Previsualizar cambios</Button> : <p>Solo el propietario puede modificar la identidad pública.</p>}{saved && <Alert role="status" tone="success" title="Vista previa local">{name} · {address}. No se publicó ningún cambio.</Alert>}</form></Card><Card><h2>Mercado Pago</h2><p>Cada complejo conecta su propia cuenta y recibe sus señas.</p><Badge tone={status === "connected" ? "success" : status === "error" ? "error" : "warning"}>{status === "connected" ? "Conectada · ejemplo" : status === "error" ? "Conexión rechazada · ejemplo" : "Sin conectar"}</Badge>{owner ? <><Select label="Escenario de conexión" value={status} onChange={(event) => setStatus(event.target.value)}><option value="disconnected">Sin conectar</option><option value="connected">Conectada</option><option value="error">Error o revocación</option></Select><Button onClick={() => setStatus(status === "connected" ? "disconnected" : "connected")}>{status === "connected" ? "Simular desconexión" : "Simular conexión"}</Button></> : <Alert title="Acción del propietario">Solo el propietario conecta la cuenta de cobro.</Alert>}<p className="ui-hint">No se inicia OAuth, no se solicitan credenciales y no se conecta una cuenta real.</p></Card></div><Alert title="Suscripción a Turnero">Es independiente de las señas de reservas. Su modelo comercial está pendiente.</Alert></div>;
}

export function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  function submit(event: FormEvent) { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) { setError("Completá el email y la contraseña de ejemplo."); return; } router.push("/demo/admin/seleccionar-complejo"); }
  return <div className="demo-narrow demo-stack"><PageHeader eyebrow="Para tu equipo" title="Ingresá a tu complejo" description="Acceso del propietario y administradores. Los jugadores no necesitan una cuenta." /><Card><Alert title="Ingreso simulado">Usá credenciales inventadas. Esta pantalla no autentica ni envía datos.</Alert><form onSubmit={submit} noValidate className="ui-stack"><Input label="Email del equipo" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} required /><Input label="Contraseña de ejemplo" type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} required />{error && <Alert role="alert" tone="error" title="Revisá los datos">{error}</Alert>}<Button type="submit">Ingresar a la demo</Button></form><DemoLink secondary href="/admin/recuperar-acceso">Recuperar acceso</DemoLink><p className="ui-hint">El alta del complejo es asistida durante el piloto.</p></Card></div>;
}

export function ChooseComplexPage() {
  const { setComplexId, setRole } = useDemo(); const router = useRouter();
  return <div className="demo-narrow demo-stack"><PageHeader eyebrow="Membresías de ejemplo" title="Elegí un complejo" description="Cada complejo tiene sus canchas, clientes y equipo." />{complexes.slice(0, 2).map((complex, index) => <Card key={complex.id}><h2>{complex.name}</h2><p>{index === 0 ? "Propietario" : "Administrador"}</p><Button onClick={() => { setComplexId(complex.id); setRole(index === 0 ? "Propietario" : "Administrador"); router.push("/demo/admin"); }}>Entrar a {complex.name}</Button></Card>)}</div>;
}

export function InvitationPage() {
  const [state, setState] = useState("valid"); const [accepted, setAccepted] = useState(false);
  return <div className="demo-narrow demo-stack"><PageHeader eyebrow="Equipo · ejemplo" title="Invitación al complejo" description="La aceptación real requerirá identidad verificada y una invitación vigente ligada al destinatario." /><Card><Select label="Estado de invitación" value={state} onChange={(event) => { setState(event.target.value); setAccepted(false); }}><option value="valid">Válida · ejemplo</option><option value="expired">Vencida</option><option value="revoked">Revocada</option></Select>{state !== "valid" ? <Alert tone="error" title="Esta invitación no está disponible">Pedile al propietario que emita una nueva invitación.</Alert> : accepted ? <Alert tone="success" title="Aceptación simulada">No se creó una membresía real.</Alert> : <><p>Complejo Los Álamos · rol administrador · fecha de ejemplo {dateLabel(DEMO_DATE)}.</p><Button onClick={() => setAccepted(true)}>Simular aceptación</Button></>}<DemoLink secondary href="/admin/ingresar">Ir al ingreso del equipo</DemoLink></Card></div>;
}

export function OwnerOnly() { return <div className="demo-stack"><PageHeader eyebrow="Permisos de ejemplo" title="Esta sección es del propietario" description="El administrador opera la agenda, las canchas y los clientes." /><Card><ShieldCheck aria-hidden="true" /><p>La protección de servidor se implementa en F04. Esta vista solo permite revisar la experiencia de acceso denegado.</p><DemoLink href="/admin">Volver al panel</DemoLink></Card></div>; }
export function MissingRecord() { return <EmptyState title="Este registro no pertenece al complejo seleccionado" action={<DemoLink secondary href="/admin">Volver al panel</DemoLink>}>Cambiá de contexto o volvé a la lista para elegir un registro del complejo actual.</EmptyState>; }
