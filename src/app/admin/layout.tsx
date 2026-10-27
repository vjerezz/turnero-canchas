import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Administración" };
// El layout es compartido con login; cada página/acción protegida valida su acceso.
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell area="admin">{children}</AppShell>;
}
