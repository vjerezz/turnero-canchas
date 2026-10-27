"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, type FocusEvent, type ReactNode } from "react";
import { AreaProvider, type Area } from "@/components/ui/area-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export type NavItem = { href: string; label: string };

function keepFocusVisible(event: FocusEvent<HTMLDivElement>) {
  const target = event.target;
  const shell = event.currentTarget;
  if (!target.matches("a, button, input, select, textarea")) return;
  // WebKit does not consistently honor scroll-margin during keyboard focus.
  requestAnimationFrame(() => {
    if (document.activeElement !== target) return;
    const rect = target.getBoundingClientRect();
    const bars = shell.querySelectorAll<HTMLElement>(".ui-bottom-actions, .shell-mobile-nav");
    const obscured = Array.from(bars).some((bar) => {
      if (bar.contains(target) || getComputedStyle(bar).position === "static") return false;
      const bounds = bar.getBoundingClientRect();
      return bounds.height > 0 && rect.bottom > bounds.top && rect.top < bounds.bottom;
    });
    if (obscured) target.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  });
}

export function AppShell({ area, children, navigation, context, basePath = "" }: { area: Area; children: ReactNode; navigation?: NavItem[]; context?: string; basePath?: string }) {
  const pathname = usePathname();
  const isAdmin = area === "admin";
  const items = navigation ?? [{ href: isAdmin ? "/admin" : "/", label: "Inicio" }];
  const links = items.map((item) => <Link key={item.href} href={item.href} className="shell-nav-link" aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>);
  return <AreaProvider area={area}><div onFocusCapture={keepFocusVisible} className={`app-shell ${isAdmin ? "app-shell-admin" : "app-shell-player"}`}>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="site-header">
      <Link className="brand" href={`${basePath}${isAdmin ? "/admin" : "/"}`}><span className="brand-mark" aria-hidden="true">T</span>Turnero <span>Canchas</span></Link>
      <nav className="shell-header-links" aria-label="Accesos del portal">{!isAdmin && basePath && links}</nav>
      <Button variant="secondary" asChild><Link href={`${basePath}${isAdmin ? "/" : "/admin"}`} aria-label={isAdmin ? "Portal de jugadores" : "Soy un complejo"}><span className="shell-link-full">{isAdmin ? "Portal de jugadores" : "Soy un complejo"}</span><span className="shell-link-short" aria-hidden="true">{isAdmin ? "Jugadores" : "Complejos"}</span><ArrowUpRight aria-hidden="true" /></Link></Button>
    </header>
    <div className="shell-body">
      <aside className="shell-sidebar"><p className="eyebrow">{context ?? (isAdmin ? "Tu complejo" : "Tu próximo partido")}</p><nav aria-label="Navegación principal">{links}</nav><p className="ui-hint shell-sidebar-note">{isAdmin ? "Todo tu complejo, en un lugar." : "Elegí dónde jugar."}</p></aside>
      <main id="contenido" tabIndex={-1} className="page-content">{children}</main>
    </div>
    <footer className="site-footer">{isAdmin ? "Todo tu complejo, en un lugar." : "Tu próximo partido empieza acá."}</footer>
    <nav className="shell-mobile-nav" aria-label="Navegación móvil">{links.slice(0, 2)}<Dialog><DialogTrigger asChild><Button variant="ghost"><Menu aria-hidden="true" />Más</Button></DialogTrigger><DialogContent variant="sheet"><DialogTitle>Navegación</DialogTitle><DialogDescription>{context ?? "Turnero Canchas"}</DialogDescription><nav aria-label="Todas las secciones" className="ui-stack">{items.map((item) => <DialogClose key={item.href} asChild><Link href={item.href} className="shell-nav-link">{item.label}</Link></DialogClose>)}</nav></DialogContent></Dialog></nav>
  </div></AreaProvider>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="ui-page-header"><div className="ui-stack"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro-copy">{description}</p></div>{action}</header>;
}

export function BottomActions({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const shell = element?.closest<HTMLElement>(".app-shell");
    if (!element || !shell) return;
    const observer = new ResizeObserver(() => shell.style.setProperty("--bottom-actions-height", `${element.getBoundingClientRect().height}px`));
    observer.observe(element);
    return () => { observer.disconnect(); shell.style.removeProperty("--bottom-actions-height"); };
  }, []);
  return <div ref={ref} className="ui-bottom-actions">{children}</div>;
}
