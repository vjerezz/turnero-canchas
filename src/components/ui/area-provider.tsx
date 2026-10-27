"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Area = "admin" | "player";
const AreaContext = createContext<Area>("admin");

// React context also crosses Radix portals; CSS inheritance alone does not.
export function AreaProvider({ area, children }: { area: Area; children: ReactNode }) {
  return <AreaContext.Provider value={area}><div data-area={area}>{children}</div></AreaContext.Provider>;
}

export function useArea() { return useContext(AreaContext); }
