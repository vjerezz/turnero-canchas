import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "@/styles/globals.css";
import { getServerEnvironment } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(getServerEnvironment().APP_URL),
  title: { default: "Turnero Canchas", template: "%s · Turnero Canchas" },
  description: "Reservas y gestión de complejos deportivos.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
