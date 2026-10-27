import { notFound } from "next/navigation";

export default async function DemoPage({ params, searchParams }: { params: Promise<{ path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { path = [] } = await params;
  const { Prototype } = await import("@/features/demo/prototype");
  const { isDemoRoute } = await import("@/features/demo/routes");
  const route = path.join("/");
  if (!isDemoRoute(route)) notFound();
  const query = await searchParams;
  const selection = { cancha: typeof query.cancha === "string" ? query.cancha : undefined, fecha: typeof query.fecha === "string" ? query.fecha : undefined, hora: typeof query.hora === "string" ? query.hora : undefined };
  return <Prototype key={route} route={route} selection={selection} />;
}
