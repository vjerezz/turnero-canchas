import Link from "next/link";

export default function PlayerPage() {
  return (
    <section className="intro-card">
      <p className="eyebrow">Turnero Canchas</p>
      <h1>Tu cancha.<br />Tu próximo partido.</h1>
      <p className="intro-copy">Encontrá tu complejo y elegí cuándo jugar.</p>
      {process.env.NODE_ENV === "development" && <Link className="ui-button ui-button-primary" href="/demo">Abrir prototipo F03</Link>}
      <div className="notice"><span className="status-dot" aria-hidden="true" /><p>Próximamente vas a poder consultar las canchas disponibles y reservar desde acá.</p></div>
    </section>
  );
}
