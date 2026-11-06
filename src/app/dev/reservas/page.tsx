import { notFound } from "next/navigation";
import { ReservationPreview } from "./preview";

export default function ReservationPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ReservationPreview />;
}
