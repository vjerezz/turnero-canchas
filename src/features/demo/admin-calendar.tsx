"use client";
import { useState, type CSSProperties, type FormEvent } from "react";
import { Plus, CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/app-shell";
import { BookingBadge, DemoLink, PreviewState } from "./common";
import { useDemo } from "./context";
import { DEMO_DATE, dateLabel, endTime, minutes, money, type DemoBooking } from "./fixtures";

export function BookingEditor({ date = DEMO_DATE, initialCourt, initialTime = "20:00", label = "Nueva reserva" }: { date?: string; initialCourt?: string; initialTime?: string; label?: string }) {
  const { complexId, courts, bookings, setBookings } = useDemo();
  const options = courts.filter((court) => court.complexId === complexId && court.active);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [courtId, setCourtId] = useState(initialCourt ?? options[0]?.id ?? "");
  const [time, setTime] = useState(initialTime);
  const [kind, setKind] = useState("reserva");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError(kind === "bloqueo" ? "Indicá el motivo del bloqueo." : "Ingresá el nombre del cliente."); return; }
    if (!courtId) { setError("Agregá una cancha activa antes de crear un turno."); return; }
    if (bookings.some((item) => item.complexId === complexId && item.courtId === courtId && item.date === date && item.status !== "Finalizada" && minutes(time) < minutes(item.time) + item.duration && minutes(time) + 60 > minutes(item.time))) { setError("Ese intervalo está ocupado. Elegí otra cancha u horario; conservamos tus datos."); return; }
    const court = options.find((item) => item.id === courtId)!;
    setBookings((current) => [...current, { id: `local-${crypto.randomUUID()}`, complexId, courtId, date, name: name.trim(), time, duration: 60, status: kind === "bloqueo" ? "Bloqueada" : "Pendiente", amount: kind === "bloqueo" ? 0 : court.price }]);
    setOpen(false); setSaved(true); setName("");
  }
  return <div className="ui-stack"><Dialog open={open} onOpenChange={(value) => { setOpen(value); setError(""); }}><DialogTrigger asChild><Button><Plus aria-hidden="true" />{label}</Button></DialogTrigger><DialogContent><DialogTitle>{kind === "bloqueo" ? "Bloqueo de demostración" : "Nueva reserva de demostración"}</DialogTitle><DialogDescription>{dateLabel(date)} · Solo modifica los ejemplos de esta sesión.</DialogDescription><form onSubmit={submit} noValidate className="ui-stack"><Select label="Tipo de registro" value={kind} onChange={(event) => setKind(event.target.value)}><option value="reserva">Reserva</option><option value="bloqueo">Bloqueo</option></Select><Input label={kind === "bloqueo" ? "Motivo" : "Nombre del cliente"} value={name} onChange={(event) => setName(event.target.value)} required /><Select label="Cancha del turno" value={courtId} onChange={(event) => setCourtId(event.target.value)}>{options.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</Select><Select label="Hora de inicio" value={time} onChange={(event) => setTime(event.target.value)}>{["16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((hour) => <option key={hour}>{hour}</option>)}</Select><p className="ui-hint">Duración de ejemplo: 60 minutos. Estado inicial ilustrativo: pendiente. Las reglas reales siguen por definir.</p>{error && <Alert role="alert" tone="error" title="No pudimos guardar">{error}</Alert>}<Button type="submit">Guardar ejemplo</Button></form></DialogContent></Dialog>{saved && <p role="status" className="ui-hint">Ejemplo agregado a la agenda.</p>}</div>;
}

export function BookingDetail({ booking, children, className, style }: { booking: DemoBooking; children: React.ReactNode; className?: string; style?: CSSProperties }) {
  const { courts } = useDemo();
  const court = courts.find((item) => item.id === booking.courtId);
  return <Dialog><DialogTrigger asChild><button type="button" className={className ?? "booking-row"} style={style}>{children}</button></DialogTrigger><DialogContent variant="sheet"><DialogTitle>{booking.status === "Bloqueada" ? "Bloqueo de cancha" : "Detalle del turno"}</DialogTitle><DialogDescription>Registro ficticio del complejo seleccionado.</DialogDescription><BookingBadge status={booking.status} /><h3>{booking.name}</h3><p>{court?.name}</p><p>{dateLabel(booking.date)} · {booking.time} – {endTime(booking.time, booking.duration)}</p><div className="summary-line"><span>Total de ejemplo</span><strong>{money(booking.amount)}</strong></div><Alert title="Acciones pendientes de definición">Cancelar, reprogramar y registrar cobros requieren políticas aprobadas. Este prototipo no ejecuta esas operaciones.</Alert><DemoLink secondary href="/admin/clientes">Ver clientes del complejo</DemoLink></DialogContent></Dialog>;
}

export function CalendarPage() {
  const { complexId, complex, courts, bookings } = useDemo();
  const options = courts.filter((court) => court.complexId === complexId && court.active);
  const [date, setDate] = useState(DEMO_DATE);
  const [courtId, setCourtId] = useState(options[0]?.id ?? "");
  const records = bookings.filter((item) => item.complexId === complexId && item.date === date);
  const hours = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
  return <div className="demo-stack"><PageHeader eyebrow={complex.name} title="Calendario de reservas" description="Todos los turnos del día, en un solo lugar." action={<BookingEditor key={`${complexId}-${date}-${courtId}`} date={date} initialCourt={courtId} />} /><div className="calendar-toolbar"><Input label="Fecha de agenda" type="date" min="2026-10-01" max="2026-12-31" value={date} onChange={(event) => setDate(event.target.value || DEMO_DATE)} /><div className="calendar-mobile-select"><Select label="Cancha en agenda" value={courtId} onChange={(event) => setCourtId(event.target.value)}>{options.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</Select></div><div className="ui-row"><BookingBadge status="Confirmada" /><BookingBadge status="Pendiente" /><BookingBadge status="Bloqueada" /></div></div><PreviewState emptyTitle="Todavía no hay turnos para esta fecha">
    <div className="calendar-desktop" role="region" aria-label="Agenda por cancha; desplazable horizontalmente" tabIndex={0}><div className="calendar-grid" style={{ "--court-count": Math.max(1, options.length) } as CSSProperties}><div className="calendar-time"><div className="calendar-column-header">Hora</div>{hours.map((hour) => <div className="calendar-hour" key={hour}>{hour}</div>)}</div>{options.map((court) => <div className="calendar-column" key={court.id}><div className="calendar-column-header">{court.name}</div><div className="calendar-track">{hours.map((hour) => <div className="calendar-cell" key={hour} />)}{records.filter((item) => item.courtId === court.id).map((booking) => <BookingDetail key={booking.id} booking={booking} className={`calendar-event event-${booking.status}`} style={{ top: `calc(var(--calendar-hour-height) * ${(minutes(booking.time) - 16 * 60) / 60})`, height: `calc(var(--calendar-hour-height) * ${booking.duration / 60} - var(--space-1))` }}><strong>{booking.name}</strong><span>{booking.time} – {endTime(booking.time, booking.duration)}</span><span>{booking.status}</span></BookingDetail>)}</div></div>)}</div></div>
    <div className="calendar-mobile ui-stack">{hours.map((hour) => {
      const active = records.filter((booking) => booking.courtId === courtId && minutes(booking.time) >= minutes(hour) && minutes(booking.time) < minutes(hour) + 60);
      const occupied = records.some((booking) => booking.courtId === courtId && minutes(booking.time) < minutes(hour) && minutes(booking.time) + booking.duration > minutes(hour));
      return <Card key={hour}><p className="ui-row"><Clock3 aria-hidden="true" /><strong>{hour}</strong></p>{active.length ? active.map((booking) => <BookingDetail key={booking.id} booking={booking}><div className="ui-stack"><strong>{booking.name}</strong><span>{booking.time} – {endTime(booking.time, booking.duration)}</span><BookingBadge status={booking.status} /></div><span>Ver detalle →</span></BookingDetail>) : occupied ? <p className="ui-hint">Ocupada por el turno anterior</p> : <p className="ui-hint">Disponible · sin turnos de ejemplo</p>}</Card>;
    })}</div>{!records.length && <EmptyState title="Agenda sin turnos">Podés agregar una reserva o bloqueo de demostración.</EmptyState>}</PreviewState><p className="ui-hint"><CalendarDays aria-hidden="true" /> Intervalos y estados ilustrativos. La garantía de no superposición en base de datos se implementará más adelante.</p></div>;
}

export function DashboardPage() {
  const { complex, complexId, bookings, courts } = useDemo();
  const today = bookings.filter((item) => item.complexId === complexId && item.date === DEMO_DATE && item.status !== "Bloqueada");
  const options = courts.filter((court) => court.complexId === complexId && court.active);
  const pending = today.filter((item) => item.status === "Pendiente");
  return <div className="demo-stack"><PageHeader eyebrow="Sábado 24 de octubre · fecha de ejemplo" title="Panel del complejo" description={complex.name} action={<BookingEditor />} /><PreviewState><div className="metric-grid"><Card><p className="eyebrow">Reservas de ejemplo</p><strong className="metric-number">{today.length}</strong><p className="ui-hint">En la fecha seleccionada</p></Card><Card><p className="eyebrow">Canchas activas</p><strong className="metric-number">{options.length}</strong><p className="ui-hint">De este complejo</p></Card><Card><p className="eyebrow">Importe de turnos</p><strong className="metric-number metric-money">{money(today.reduce((sum, item) => sum + item.amount, 0))}</strong><p className="ui-hint">No representa dinero cobrado</p></Card><Card className="metric-pending"><p className="eyebrow">Pendientes</p><strong className="metric-number">{pending.length}</strong><p className="ui-hint">Sin vencimiento automático</p></Card></div><div className="dashboard-columns"><div className="demo-stack"><div className="demo-section-heading"><h2>Canchas del complejo</h2><LinkCalendar /></div><div className="demo-two-col">{options.map((court) => {
      const record = bookings.find((item) => item.courtId === court.id && item.date === DEMO_DATE && item.status !== "Finalizada");
      return <Card key={court.id}><h3>{court.name}</h3><p className="ui-hint">{court.covered ? "Techada" : "Césped sintético"}</p>{record ? <BookingDetail booking={record}><div className="ui-stack"><BookingBadge status={record.status} /><span>{record.name}</span><span>{record.time} – {endTime(record.time, record.duration)}</span></div></BookingDetail> : <p>Sin próximos turnos de ejemplo</p>}</Card>;
    })}</div></div><div className="demo-stack"><Alert tone="warning" title={`${pending.length} turnos pendientes`}>El estado requiere revisión. No se envían recordatorios ni se libera disponibilidad automáticamente.</Alert><Card><h2>Próximos turnos</h2>{today.filter((item) => item.status !== "Finalizada").sort((a, b) => a.time.localeCompare(b.time)).map((booking) => <BookingDetail key={booking.id} booking={booking}><strong>{booking.time}</strong><span>{booking.name}</span><BookingBadge status={booking.status} /></BookingDetail>)}<DemoLink secondary href="/admin/calendario">Ver calendario</DemoLink></Card></div></div></PreviewState></div>;
}
function LinkCalendar() { return <DemoLink secondary href="/admin/calendario">Ver agenda</DemoLink>; }

