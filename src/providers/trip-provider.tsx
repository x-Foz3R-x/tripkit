// src/providers/trip-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "~/lib/supabase";
import { getAppStorageItem, setAppStorageItem } from "~/lib/storage";

export type TripSession = {
  tripId: string;
  userId: string;
};

type TripContextType = {
  activeTripId: string | null;
  activeSession: TripSession | null;
  sessions: Record<string, TripSession>;
  isLoaded: boolean;
  isAdmin: boolean;
  joinTrip: (session: TripSession) => void;
  leaveTrip: (tripId: string) => void;
  switchTrip: (tripId: string) => void;
};

const TripContext = createContext<TripContextType | null>(null);

const STORAGE_KEY = "sessions";

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, TripSession>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Pobieranie danych z LocalStorage przy uruchomieniu aplikacji
  useEffect(() => {
    try {
      const stored = getAppStorageItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          activeTripId: string | null;
          sessions: Record<string, TripSession>;
        };
        setSessions(parsed.sessions || {});
        setActiveTripId(parsed.activeTripId || null);
      }
    } catch (e) {
      console.error("Błąd odczytu sesji z pamięci:", e);
    }
    setIsLoaded(true);
  }, []);

  // Zapisywanie do LocalStorage przy każdej zmianie
  useEffect(() => {
    if (!isLoaded) return;
    setAppStorageItem(STORAGE_KEY, JSON.stringify({ activeTripId, sessions }));
  }, [activeTripId, sessions, isLoaded]);

  // Weryfikacja uprawnień bezpośrednio z bazy danych
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!activeTripId || !sessions[activeTripId]) {
        setIsAdmin(false);
        return;
      }

      const userId = sessions[activeTripId].userId;
      const { data } = await supabase.from("users").select("is_admin").eq("id", userId).single();

      setIsAdmin(data?.is_admin ?? false);
    };

    void checkAdminStatus();
  }, [activeTripId, sessions]);

  const joinTrip = useCallback((session: TripSession) => {
    setSessions((prev) => ({ ...prev, [session.tripId]: session }));
    setActiveTripId(session.tripId);
  }, []);

  const leaveTrip = useCallback((tripId: string) => {
    setSessions((prev) => {
      const newSessions = { ...prev };
      delete newSessions[tripId];
      return newSessions;
    });
    setActiveTripId((prev) => (prev === tripId ? null : prev));
  }, []);

  const switchTrip = useCallback(
    (tripId: string) => {
      if (sessions[tripId]) {
        setActiveTripId(tripId);
      }
    },
    [sessions],
  );

  const activeSession = activeTripId ? (sessions[activeTripId] ?? null) : null;

  return (
    <TripContext.Provider
      value={{
        activeTripId,
        activeSession,
        sessions,
        isLoaded,
        isAdmin,
        joinTrip,
        leaveTrip,
        switchTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
}
