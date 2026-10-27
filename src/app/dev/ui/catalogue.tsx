"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Ellipsis, RotateCcw } from "lucide-react";
import { AppShell, BottomActions, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Badge, Alert, Skeleton, EmptyState } from "@/components/ui/feedback";
import { FilterChip, TimeSlot } from "@/components/ui/selection";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Toast } from "@/components/ui/toast";
import type { Area } from "@/components/ui/area-provider";

export function Catalogue() {
  const [area, setArea] = useState<Area>("player");
  const [sport, setSport] = useState("Fútbol");
  const [time, setTime] = useState("19:00");
  const [toast, setToast] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [empty, setEmpty] = useState(true);
  const nameRef = useRef<HTMLInputElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nameRef.current?.value.trim()) {
      setError("Ingresá un nombre para continuar."); setSaved(false); nameRef.current?.focus(); return;
    }
    setError(""); setSaved(true); setToast(true);
  }
  return <AppShell area={area} context="Biblioteca de interfaz" navigation={[{ href: "#fundamentos", label: "Fundamentos" }, { href: "#controles", label: "Controles" }, { href: "#estados", label: "Estados" }]}>
    <div className="catalogue ui-stack">
      <PageHeader eyebrow="F02 · Biblioteca de interfaz" title="Una cancha. Mil posibilidades." description="Las piezas de Turnero, listas para jugar en cualquier pantalla." action={<Badge tone="info">Solo desarrollo</Badge>} />
      <div className="catalogue-toolbar"><p>Vista de la interfaz</p><div className="ui-row" role="group" aria-label="Área de la interfaz"><FilterChip selected={area === "player"} onClick={() => setArea("player")}>Jugador</FilterChip><FilterChip selected={area === "admin"} onClick={() => setArea("admin")}>Administración</FilterChip></div></div>
      <section id="fundamentos" className="ui-stack catalogue-section"><div className="section-heading"><span className="eyebrow">01 / Identidad</span><h2>Simple. Clara. Deportiva.</h2></div><div className="catalogue-grid">
        <Card className="typography-card"><p className="eyebrow">Tipografía</p><h2>El próximo partido<br />empieza acá.</h2><p>Inter para decidir. Bricolage Grotesque para destacar.</p><p className="numeric-sample">19:30 · $ 24.000,00</p><p className="ui-hint">Horarios e importes con cifras alineadas.</p></Card>
        <Card><h3>Color con propósito</h3><div className="swatch-grid">{["Tinta", "Volt", "Azul cancha", "Superficie"].map((color, i) => <div key={color}><div className={`swatch swatch-${i}`} /><p>{color}</p></div>)}</div><p className="ui-hint">Tinta para gestionar. Volt para la acción del jugador.</p></Card>
      </div></section>
      <section id="controles" className="ui-stack catalogue-section"><div className="section-heading"><span className="eyebrow">02 / Interacción</span><h2>Cada acción, en su lugar.</h2></div><div className="catalogue-grid">
        <Card><h3>Botones y acciones</h3><div className="ui-row"><Button onClick={() => setToast(true)}>Acción principal<ArrowRight aria-hidden="true" /></Button><Button variant="secondary" onClick={() => setToast(true)}>Secundaria</Button><Button variant="ghost" onClick={() => setToast(true)}>Discreta</Button></div><div className="ui-row"><Button disabled>No disponible</Button><Button loading>Enviando…</Button></div><Dialog><DialogTrigger asChild><Button variant="destructive">Probar confirmación</Button></DialogTrigger><DialogContent><DialogTitle>¿Descartar este ejemplo?</DialogTitle><DialogDescription>Es una demostración. No modifica reservas ni datos de clientes.</DialogDescription><div className="ui-row"><DialogClose asChild><Button variant="secondary">Volver</Button></DialogClose><DialogClose asChild><Button variant="destructive" onClick={() => setToast(true)}>Descartar ejemplo</Button></DialogClose></div></DialogContent></Dialog></Card>
        <Card><h3>Formulario</h3><form className="ui-stack" onSubmit={submit} noValidate><Input ref={nameRef} label="Nombre" name="name" autoComplete="name" placeholder="Ej. Valentina" error={error} hint="Usamos datos de ejemplo; no se envían." required /><Select label="Deporte" defaultValue="futbol"><option value="futbol">Fútbol</option><option value="padel">Pádel</option><option value="tenis">Tenis</option></Select><Input label="Complejo" value="Complejo de demostración" disabled /><Button type="submit">Validar ejemplo<Check aria-hidden="true" /></Button><div aria-live="polite">{saved && <Alert tone="success" title="Ejemplo validado">El formulario conservó tus datos.</Alert>}</div></form></Card>
        <Card><h3>Filtros y horarios</h3><div className="ui-row" role="group" aria-label="Filtrar por deporte">{["Fútbol", "Pádel", "Tenis"].map((item) => <FilterChip key={item} selected={sport === item} onClick={() => setSport(item)}>{item}</FilterChip>)}</div><p className="ui-hint">Horarios ilustrativos · {sport}</p><div className="slot-grid" role="group" aria-label="Elegir horario">{["18:00", "19:00", "20:00"].map((item) => <TimeSlot key={item} time={item} state={time === item ? "selected" : "available"} onClick={() => setTime(item)} />)}<TimeSlot time="21:00" state="unavailable" /><TimeSlot time="22:00" state="loading" /></div><p role="status" className="ui-hint">Seleccionaste {time}. No se genera una reserva.</p></Card>
        <Card><h3>Diálogos y menús</h3><p className="intro-copy">El foco acompaña cada paso y vuelve al control de origen al cerrar.</p><div className="ui-row"><Dialog><DialogTrigger asChild><Button>Abrir diálogo</Button></DialogTrigger><DialogContent><DialogTitle>Todo en contexto.</DialogTitle><DialogDescription>La acción conserva el color del área, incluso fuera del contenido de la página.</DialogDescription><Input label="Nota de ejemplo" placeholder="Escribí una nota" /><DialogClose asChild><Button>Listo</Button></DialogClose></DialogContent></Dialog><Dialog><DialogTrigger asChild><Button variant="secondary">Abrir panel</Button></DialogTrigger><DialogContent variant="sheet"><DialogTitle>Detalle de ejemplo</DialogTitle><DialogDescription>Un panel adaptable con contenido desplazable.</DialogDescription><Alert title="Sin datos reales">Las pantallas de reservas se construyen en F03.</Alert><DialogClose asChild><Button>Entendido</Button></DialogClose></DialogContent></Dialog><DropdownMenu><DropdownMenuTrigger asChild><Button variant="secondary" aria-label="Más acciones"><Ellipsis aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setToast(true)}>Mostrar aviso</DropdownMenuItem><DropdownMenuItem onSelect={() => { setTime("19:00"); setSport("Fútbol"); }}>Restablecer selección</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></Card>
      </div></section>
      <section id="estados" className="ui-stack catalogue-section"><div className="section-heading"><span className="eyebrow">03 / Respuestas</span><h2>Siempre sabés qué pasa.</h2></div><Card><h3>Estados visuales</h3><div className="ui-row"><Badge>Finalizado</Badge><Badge tone="info">Confirmado</Badge><Badge tone="warning">Pendiente</Badge><Badge tone="error">Cancelado</Badge><Badge tone="success">Cambios guardados</Badge></div><p className="ui-hint">Muestras de apariencia. No definen transiciones de reservas ni pagos.</p></Card><div className="catalogue-grid"><Card><h3>Información y errores</h3><Alert title="Una aclaración útil">El mensaje acompaña la acción.</Alert><Alert tone="warning" title="Revisá los datos">La advertencia incluye texto, además de color.</Alert><Alert tone="error" title="No pudimos cargar el ejemplo"><p>Podés volver a intentarlo sin perder tu selección.</p><Button variant="secondary" onClick={() => setToast(true)}><RotateCcw aria-hidden="true" />Probar reintento</Button></Alert></Card><Card><h3>Vacío y carga</h3>{empty ? <EmptyState title="Todavía no hay resultados" action={<Button variant="secondary" onClick={() => setEmpty(false)}>Mostrar ejemplo</Button>}>Probá con otros filtros.</EmptyState> : <div className="ui-stack"><Alert tone="success" title="Ejemplo disponible">El reintento actualizó esta sección.</Alert><Button variant="ghost" onClick={() => setEmpty(true)}>Restablecer vacío</Button></div>}<Skeleton /><p className="ui-hint">La carga respeta la preferencia de movimiento reducido.</p></Card></div></section>
      <BottomActions><div><strong>Tu selección de ejemplo</strong><p className="ui-hint">{sport} · {time}</p></div><Button onClick={() => setToast(true)}>Probar acción<ArrowRight aria-hidden="true" /></Button></BottomActions>
      <Toast open={toast} onOpenChange={setToast} title="Interacción de ejemplo" description="La interfaz respondió. No se guardaron datos ni se enviaron mensajes." />
    </div>
  </AppShell>;
}
