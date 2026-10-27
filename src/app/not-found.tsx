import Link from "next/link";

export default function NotFound() {
  return <main className="page-content"><section className="intro-card"><p className="eyebrow">Página no encontrada</p><h1>Por acá no hay cancha.</h1><p>Revisá la dirección o volvé al inicio.</p><Link className="nav-link" href="/">Volver al inicio</Link></section></main>;
}
