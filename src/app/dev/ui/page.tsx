import { notFound } from "next/navigation";
import { Catalogue } from "./catalogue";

export default function UIPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Catalogue />;
}
