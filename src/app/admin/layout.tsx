import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Administración" };
// Base pública sin datos operativos. Autenticación y autorización en F04.
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell area="admin">{children}</AppShell>;
}
