import { AppShell } from "@/components/layout/app-shell";

export default function PlayerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell area="player">{children}</AppShell>;
}
