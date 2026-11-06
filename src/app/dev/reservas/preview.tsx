"use client";

import { useState } from "react";
import { ReservationForm } from "@/features/reservations/reservation-form";
import { Select } from "@/components/ui/field";

const outcomes = {
  conflict: "El turno acaba de ocuparse. Volvé a disponibilidad y elegí otro horario.",
  price: "El precio cambió. Recargá esta página para revisar el importe antes de reservar.",
  uncertain: "No pudimos comprobar el resultado. Reintentá con los mismos datos: no se duplicará la reserva.",
};

export function ReservationPreview() {
  const [scenario, setScenario] = useState<keyof typeof outcomes>("conflict");
  const [submission, setSubmission] = useState("");
  async function simulate(_state: { message: string }, data: FormData) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmission(`${data.get("name")} · ${data.get("email")}`);
    return { message: outcomes[scenario] };
  }
  return <main className="shell-main ui-stack" data-area="admin">
    <p>Solo desarrollo · simulación sin persistencia</p>
    <Select label="Escenario de prueba" value={scenario} onChange={(event) => setScenario(event.target.value as keyof typeof outcomes)}>
      <option value="conflict">Turno ocupado</option><option value="price">Cambio de precio</option><option value="uncertain">Resultado incierto</option>
    </Select>
    <section className="ui-card ui-stack">
      <p>Complejo de prueba · Cancha 1</p><h1>Nueva reserva</h1>
      <p>Jornada 10/11/2026 · 19:00 · 60 minutos</p>
      <p>Total: $ 30.000,00 · Seña del 30%: $ 9.000,00</p>
      <ReservationForm court="00000000-0000-4000-8000-000000000001" date="2026-11-10" minute={1140} request="00000000-0000-4000-8000-000000000002" total={3000000} submitAction={simulate} />
    </section>
    {submission && <p data-testid="submission">Datos recibidos en la simulación: {submission}</p>}
  </main>;
}
