"use client";
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { complexes, initialBookings, initialClients, initialCourts, initialMembers, type DemoBooking, type Court, type Client, type Member } from "./fixtures";

function useDemoState() {
  const [complexId, setComplexId] = useState("alamos");
  const [role, setRole] = useState<"Propietario" | "Administrador">("Propietario");
  const [bookings, setBookings] = useState<DemoBooking[]>(initialBookings);
  const [courts, setCourts] = useState<Court[]>(initialCourts);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [request, setRequest] = useState<{ courtId: string; date: string; time: string; amount: number } | null>(null);
  const complex = complexes.find((item) => item.id === complexId)!;
  return { complexId, setComplexId, complex, role, setRole, bookings, setBookings, courts, setCourts, clients, setClients, members, setMembers, request, setRequest };
}
const Context = createContext<ReturnType<typeof useDemoState> | null>(null);
const subscribe = () => () => {};
export function DemoProvider({ children }: { children: ReactNode }) {
  const state = useDemoState();
  // Local interactive fixtures must be ready before forms accept input.
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return <Context.Provider value={state}>{ready ? children : <p role="status">Preparando demostración…</p>}</Context.Provider>;
}
export function useDemo() { const context = useContext(Context); if (!context) throw new Error("DemoProvider requerido"); return context; }
