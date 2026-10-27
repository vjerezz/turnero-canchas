import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function DemoLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { DemoProvider } = await import("@/features/demo/context");
  return <DemoProvider>{children}</DemoProvider>;
}
