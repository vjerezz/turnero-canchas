import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="intro-card">
      <p className="eyebrow">Para complejos deportivos</p>
      <h1>Más cancha.<br />Menos vueltas.</h1>
      <p className="intro-copy">Un lugar para organizar las canchas y las reservas de tu complejo.</p>
      {process.env.NODE_ENV === "development" && <Link className="ui-button ui-button-primary" href="/demo/admin">Abrir panel de demostración</Link>}
      <div className="notice"><span className="status-dot" aria-hidden="true" /><p>El panel de gestión estará disponible próximamente.</p></div>
    </section>
  );
}
