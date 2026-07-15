"use client";

import { createContext, useContext } from "react";
import type { TripModules } from "~/lib/server/trips";

export type TripRouteContextValue = {
  tripId: string;
  tripName: string;
  urlKey: string;
  userId: string | null;
  userName: string | null;
  isAdmin: boolean;
  modules: TripModules;
};

const TripRouteContext = createContext<TripRouteContextValue | null>(null);

export function TripRouteProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: TripRouteContextValue;
}) {
  return <TripRouteContext.Provider value={value}>{children}</TripRouteContext.Provider>;
}

export function useTripRoute() {
  const context = useContext(TripRouteContext);
  if (!context) throw new Error("useTripRoute wymaga TripRouteProvider.");
  return context;
}
