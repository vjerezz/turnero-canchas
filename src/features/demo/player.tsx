"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, MapPin, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { FilterChip, TimeSlot } from "@/components/ui/selection";
import { PageHeader } from "@/components/layout/app-shell";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Back, CourtArt, DemoLink, PreviewState } from "./common";
import { useDemo } from "./context";
import { complexes, DEMO_DATE, demoDays, demoTimes, availableTimes, dateLabel, endTime, money, type Complex } from "./fixtures";

export function SearchPage() {
  const { courts, bookings } = useDemo();
  const [sport, setSport] = useState("Todos");
  const [date, setDate] = useState(DEMO_DATE);
  const [time, setTime] = useState("");
  const [query, setQuery] = useState("");
  const [covered, setCovered] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState({ sport: "Todos", date: DEMO_DATE, time: "", query: "" });
  const matches = complexes.filter((complex) => `${complex.name} ${complex.neighborhood}`.toLocaleLowerCase("es").includes(filters.query.toLocaleLowerCase("es")) && courts.some((court) => court.complexId === complex.id && court.active && (!covered || court.covered) && (filters.sport === "Todos" || court.sport === filters.sport) && availableTimes(court.id, filters.date, bookings).some((slot) => !filters.time || slot === filters.time)));
  function submit(event: FormEvent) { event.preventDefault(); setFilters({ sport, date, time, query: query.trim() }); setSearchOpen(false); }
  const fields = <><Select label="Deporte" value={sport} onChange={(event) => setSport(event.target.value)}>{["Todos", "Fútbol 5", "Fútbol 7", "Pádel"].map((item) => <option key={item}>{item}</option>)}</Select><Select label="Fecha" value={date} onChange={(event) => setDate(event.target.value)}>{demoDays.map((day) => <option key={day} value={day}>{dateLabel(day)}</option>)}</Select><Select label="Horario" value={time} onChange={(event) => setTime(event.target.value)}><option value="">Cualquier horario</option>{demoTimes.map((slot) => <option key={slot}>{slot}</option>)}</Select><Input label="Complejo o barrio" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. Palermo" /><Button type="submit"><Search aria-hidden="true" />Buscar</Button></>;
  return <div className="demo-stack">
    <section className="search-hero"><div className="hero-art"><CourtArt /></div><div className="hero-copy"><Badge>Tu próximo partido empieza acá</Badge><h1><span className="search-title-wide">Encontrá cancha.<br />Elegí cuándo jugar.</span><span className="search-title-mobile">Reservá tu cancha</span></h1><p>Elegí deporte, día y horario. Encontrá tu complejo y reservá como invitado.</p></div><form className="search-form search-form-desktop" onSubmit={submit}>{fields}</form><div className="search-mobile"><Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogTrigger asChild><Button variant="secondary" className="search-mobile-trigger" aria-label="Modificar búsqueda"><Search aria-hidden="true" /><span><strong>{filters.sport} · {dateLabel(filters.date)}</strong><small>{filters.time || "Cualquier horario"}{filters.query ? ` · ${filters.query}` : ""}</small></span></Button></DialogTrigger><DialogContent><DialogTitle>Buscá tu próximo partido</DialogTitle><DialogDescription>Elegí deporte, fecha y horario.</DialogDescription><form className="search-form" onSubmit={submit}>{fields}</form></DialogContent></Dialog></div></section>
    <div className="demo-section-heading"><div><h2>{matches.length} complejos disponibles</h2><p className="ui-hint" aria-live="polite">{filters.sport} · {dateLabel(filters.date)} · {filters.time || "cualquier horario"}</p></div><div className="ui-row"><FilterChip selected={!covered} onClick={() => setCovered(false)}>Todos</FilterChip><FilterChip selected={covered} onClick={() => setCovered(!covered)}>Techada</FilterChip></div></div>
    <PreviewState>{matches.length ? <div className="demo-results">{matches.map((complex) => {
      const court = courts.find((item) => item.complexId === complex.id && item.active && (!covered || item.covered) && (filters.sport === "Todos" || item.sport === filters.sport) && availableTimes(item.id, filters.date, bookings).some((slot) => !filters.time || slot === filters.time))!;
      const slots = availableTimes(court.id, filters.date, bookings).filter((slot) => !filters.time || slot === filters.time).slice(0, 3);
      const params = new URLSearchParams({ fecha: filters.date, cancha: court.id });
      return <Card key={complex.id} className="complex-card"><div className="complex-art"><CourtArt variant={complex.art} padel={court.sport === "Pádel"} /><Badge>{court.sport}</Badge></div><div className="complex-card-body"><h3>{complex.name}</h3><p className="ui-row ui-hint"><MapPin aria-hidden="true" />{complex.neighborhood} · CABA</p><p className="ui-hint">{court.covered ? "Techada" : "Al aire libre"} · Iluminación</p><div className="complex-slots"><p className="eyebrow">Horarios de ejemplo</p><div className="ui-row">{slots.map((slot) => <Link className="mini-slot" key={slot} href={`/demo/complejos/${complex.slug}/reservar?${params}&hora=${slot}`}>{slot}</Link>)}</div></div><div className="price-row"><span><small>Desde </small><strong>{money(court.price)}</strong><small> / turno demo</small></span><Link className="demo-text-link" href={`/demo/complejos/${complex.slug}?${params}`}>Ver complejo<ArrowRight aria-hidden="true" /></Link></div></div></Card>;
    })}</div> : <EmptyState title="No encontramos canchas con esos filtros" action={<Button onClick={() => { setSport("Todos"); setQuery(""); setTime(""); setCovered(false); setFilters({ sport: "Todos", date: DEMO_DATE, time: "", query: "" }); }}>Limpiar filtros</Button>}>Probá con otro deporte, barrio u horario.</EmptyState>}</PreviewState>
  </div>;
}

export function ComplexPage({ complex }: { complex: Complex }) {
  const { courts } = useDemo();
  return <div className="demo-stack"><Back href="/">Buscar canchas</Back><section className="complex-hero"><CourtArt variant={complex.art} padel={complex.sport === "Pádel"} /><div className="ui-stack"><Badge tone="info">Complejo de demostración</Badge><h1>{complex.name}</h1><p className="ui-row"><MapPin aria-hidden="true" />{complex.address}</p><p className="intro-copy">Un lugar para juntarte con tu equipo y disfrutar el próximo partido.</p><DemoLink href={`/complejos/${complex.slug}/reservar`}>Elegir cancha y horario</DemoLink></div></section><div className="demo-two-col"><Card><h2>Conocé el complejo</h2><div className="ui-row"><Badge>{complex.covered ? "Canchas techadas" : "Al aire libre"}</Badge><Badge>Iluminación</Badge><Badge>Vestuarios</Badge></div><p>Perfil ilustrativo. Consultá siempre la información publicada del complejo antes de reservar.</p></Card><Card><h2>Reservá como invitado</h2><p>No necesitás una cuenta. En el producto final, tu reserva se consulta con un enlace privado enviado por email.</p><Alert title="Condiciones a definir">Duración, seña, vencimiento y cancelación todavía no tienen una política aprobada.</Alert></Card></div><h2>Canchas del complejo</h2><PreviewState><div className="demo-results">{courts.filter((court) => court.complexId === complex.id && court.active).map((court) => <Card key={court.id}><h3>{court.name}</h3><p>{court.sport} · {court.covered ? "Techada" : "Descubierta"}</p><p className="demo-price">{money(court.price)} <small>por turno de ejemplo</small></p><DemoLink href={`/complejos/${complex.slug}/reservar?cancha=${court.id}`}>Ver horarios</DemoLink></Card>)}</div></PreviewState></div>;
}

export function ReservePage({ complex, initialCourt, initialDate, initialTime }: { complex: Complex; initialCourt?: string; initialDate?: string; initialTime?: string }) {
  const { courts, bookings, setRequest } = useDemo();
  const router = useRouter();
  const options = courts.filter((court) => court.complexId === complex.id && court.active);
  const [courtId, setCourtId] = useState(options.find((court) => court.id === initialCourt)?.id ?? options[0]?.id ?? "");
  const [date, setDate] = useState(demoDays.includes(initialDate ?? "") ? initialDate! : DEMO_DATE);
  const [time, setTime] = useState(() => initialTime && availableTimes(courtId, date, bookings).includes(initialTime) ? initialTime : "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; selection?: string }>({});
  const [scenario, setScenario] = useState("normal");
  const [failure, setFailure] = useState("");
  const [repriceAccepted, setRepriceAccepted] = useState(false);
  const court = options.find((item) => item.id === courtId);
  const slots = availableTimes(courtId, date, bookings);
  const price = (court?.price ?? 0) + (repriceAccepted ? 200000 : 0);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { name: name.trim() ? undefined : "Ingresá tu nombre.", email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "Ingresá un email válido.", selection: time ? undefined : "Elegí un horario para continuar." };
    setErrors(next);
    if (Object.values(next).some(Boolean)) { const target = !name.trim() ? "guest-name" : next.email ? "guest-email" : "guest-slots"; document.getElementById(target)?.focus(); return; }
    if (scenario === "conflict") { setFailure("Ese horario acaba de ocuparse. Elegí otro para continuar."); setTime(""); setScenario("normal"); return; }
    if (scenario === "price" && !repriceAccepted) { setFailure("El precio del ejemplo cambió. Revisá el nuevo total antes de continuar."); return; }
    if (scenario === "error") { setFailure("No pudimos completar la solicitud de ejemplo. Tus datos siguen en el formulario."); return; }
    setRequest({ courtId, date, time, amount: price }); router.push("/demo/reservas/ejemplo");
  }
  return <div className="demo-stack"><Back href={`/complejos/${complex.slug}`}>{complex.name}</Back><PageHeader eyebrow="Tu próximo partido" title="Elegí tu cancha y horario" description={`${complex.name} · ${complex.neighborhood}`} /><form onSubmit={submit} noValidate className="booking-layout"><div className="demo-stack"><Card><h2>1. Cuándo y dónde</h2><div className="demo-day-list" role="group" aria-label="Día del turno">{demoDays.map((day) => <button type="button" className="demo-day" key={day} aria-pressed={date === day} aria-label={dateLabel(day)} onClick={() => { setDate(day); setTime(""); setFailure(""); setRepriceAccepted(false); }}><span>{["Sáb", "Dom", "Lun"][demoDays.indexOf(day)]}</span><strong>{day.slice(-2)}</strong></button>)}</div><Select label="Cancha" value={courtId} onChange={(event) => { setCourtId(event.target.value); setTime(""); setRepriceAccepted(false); }}>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><div id="guest-slots" tabIndex={-1} className="ui-stack"><h3>Horarios disponibles</h3><div className="slot-grid">{demoTimes.map((slot) => <TimeSlot key={slot} time={slot} state={!slots.includes(slot) ? "unavailable" : slot === time ? "selected" : "available"} onClick={() => { setTime(slot); setFailure(""); }} />)}</div>{errors.selection && <p role="alert" className="ui-field-error">{errors.selection}</p>}</div><p className="ui-hint">Turnos de 60 minutos e importes ilustrativos. No definen la duración comercial.</p></Card><Card><h2>2. Tus datos</h2><p>Reservá como invitado, sin crear una cuenta.</p><Input id="guest-name" label="Nombre y apellido" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} required /><Input id="guest-email" label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} hint="En esta demo no se envían emails. Usá datos ficticios." required /></Card><details className="demo-scenarios"><summary>Probar un conflicto o error</summary><Select label="Resultado de la solicitud" value={scenario} onChange={(event) => { setScenario(event.target.value); setFailure(""); setRepriceAccepted(false); }}><option value="normal">Solicitud de ejemplo</option><option value="conflict">Horario ocupado al enviar</option><option value="price">Precio modificado</option><option value="error">Error de conexión</option></Select></details></div><Card className="booking-summary"><p className="eyebrow">Resumen del turno</p><h2>{complex.name}</h2><p>{court?.name}</p><p className="ui-row"><CalendarDays aria-hidden="true" />{dateLabel(date)}</p><p className="demo-price">{time ? `${time} – ${endTime(time)}` : "Elegí un horario"}</p><div className="summary-line"><span>Total de ejemplo</span><strong>{money(price)}</strong></div><div className="summary-line"><span>Seña / saldo</span><span>A definir</span></div><Alert title="Antes de continuar">Condiciones de seña, vencimiento y cancelación pendientes. No se genera una reserva real.</Alert>{failure && <Alert role="alert" tone="error" title="Revisá tu solicitud">{failure}{scenario === "price" && !repriceAccepted && <Button variant="secondary" onClick={() => { setRepriceAccepted(true); setFailure(""); }}>Aceptar total de ejemplo: {money((court?.price ?? 0) + 200000)}</Button>}{scenario === "error" && <Button variant="secondary" onClick={() => { setScenario("normal"); setFailure(""); }}>Reintentar</Button>}</Alert>}<Button type="submit">Simular solicitud<ArrowRight aria-hidden="true" /></Button><p className="ui-hint"><ShieldCheck aria-hidden="true" /> Sin pagos ni envíos reales.</p></Card></form></div>;
}

export function ReservationPage({ id }: { id: string }) {
  const { request, courts } = useDemo();
  const [state, setState] = useState("pending");
  if (id !== "ejemplo") return <PrivateAccess />;
  const court = courts.find((item) => item.id === request?.courtId) ?? courts[0];
  const complex = complexes.find((item) => item.id === court.complexId)!;
  const labels = { pending: "Solicitud de ejemplo recibida", processing: "El pago está en proceso", approved: "Pago aprobado · ejemplo", rejected: "El pago fue rechazado · ejemplo", unknown: "Estamos verificando el pago", cancelled: "Reserva cancelada · ejemplo" };
  return <div className="demo-narrow demo-stack"><Back href="/">Volver a buscar</Back><PageHeader eyebrow="Recorrido de demostración" title={labels[state as keyof typeof labels]} description="Esta pantalla muestra un estado ficticio. No creamos una reserva ni procesamos un pago." /><Card><div className="ui-row"><Badge tone={state === "approved" ? "success" : state === "rejected" || state === "cancelled" ? "error" : "warning"}>{state === "approved" ? "Aprobado (demo)" : state === "cancelled" ? "Cancelada (demo)" : "Estado de ejemplo"}</Badge></div><h2>{complex.name}</h2><p>{court.name}</p><p>{dateLabel(request?.date ?? DEMO_DATE)} · {request?.time ?? "19:00"}</p><p className="demo-price">{money(request?.amount ?? court.price)} <small>total de ejemplo</small></p><Alert title="Acceso privado en el producto final">El enlace de consulta se envía al email de la reserva. Un ID o un email escrito no autorizan el acceso.</Alert><Select label="Vista del resultado" value={state} onChange={(event) => setState(event.target.value)}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select>{state === "pending" && <Button onClick={() => setState("processing")}>Simular inicio de pago</Button>}{["processing", "unknown"].includes(state) && <Button variant="secondary" onClick={() => setState(state === "processing" ? "unknown" : "approved")}>Simular consulta de estado</Button>}{state === "rejected" && <Button onClick={() => setState("processing")}>Simular reintento</Button>}{state === "approved" && <p className="ui-row"><Check aria-hidden="true" />Fin del recorrido de demostración.</p>}<DemoLink secondary href="/mis-reservas">Recuperar acceso</DemoLink></Card></div>;
}

export function PrivateAccess({ invalid = false }: { invalid?: boolean }) { return <div className="demo-narrow demo-stack"><PageHeader eyebrow="Consulta privada" title={invalid ? "Este enlace no está disponible" : "Necesitás un enlace privado"} description="No podemos mostrar una reserva sin verificar el acceso." /><Card><Alert title={invalid ? "Enlace inválido o vencido" : "Tus datos son privados"}>Solicitá un nuevo enlace para consultar tu reserva.</Alert><DemoLink href="/mis-reservas">Solicitar enlace</DemoLink><DemoLink secondary href="/">Buscar canchas</DemoLink></Card></div>; }

export function AccessPage() {
  const [valid, setValid] = useState(false);
  return valid ? <div className="demo-narrow demo-stack"><PageHeader eyebrow="Enlace privado · escenario ficticio" title="Consultá tu reserva" description="En el producto final se verifica el enlace en el servidor antes de dar acceso." /><Card><Alert title="Enlace válido de demostración">No es una credencial real y solo abre una ficha ficticia.</Alert><DemoLink href="/reservas/ejemplo">Simular canje y ver ejemplo</DemoLink><Button variant="secondary" onClick={() => setValid(false)}>Ver enlace inválido</Button></Card></div> : <div className="demo-stack"><PrivateAccess invalid /><div className="demo-narrow"><Button variant="secondary" onClick={() => setValid(true)}>Probar enlace válido de ejemplo</Button></div></div>;
}

export function RecoverPage({ team = false }: { team?: boolean }) {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Ingresá un email válido."); return; } setError(""); setSent(true); }
  return <div className="demo-narrow demo-stack"><Back href={team ? "/admin/ingresar" : "/"}>{team ? "Volver al ingreso" : "Buscar canchas"}</Back><PageHeader eyebrow={team ? "Acceso del equipo" : "Mis reservas"} title={team ? "Recuperá tu acceso" : "Recuperá tu reserva"} description={team ? "Ingresá el email de tu equipo." : "Ingresá el email que usaste al reservar. No necesitás crear una cuenta."} /><Card>{sent ? <><Alert tone="success" title="Solicitud de ejemplo recibida">Si corresponde, recibirías un enlace en tu email. No confirmamos si existe una cuenta o reserva asociada.</Alert><p className="ui-hint">No se envió ningún correo.</p><DemoLink secondary href={team ? "/admin/ingresar" : "/acceso-reserva"}>Ver siguiente pantalla</DemoLink><Button variant="ghost" onClick={() => setSent(false)}>Usar otro email</Button></> : <form onSubmit={submit} noValidate className="ui-stack"><Input label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} required /><Button type="submit">Solicitar enlace de ejemplo</Button></form>}</Card></div>;
}




