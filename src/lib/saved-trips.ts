import { getAppStorageItem, setAppStorageItem } from "~/lib/storage";

const STORAGE_KEY = "saved_trips";
const MAX_SAVED_TRIPS = 12;

export type SavedTrip = {
  urlKey: string;
  tripName: string;
  userName: string;
  lastVisitedAt: string;
};

function isSavedTrip(value: unknown): value is SavedTrip {
  if (!value || typeof value !== "object") return false;

  const trip = value as Partial<SavedTrip>;
  return (
    typeof trip.urlKey === "string" &&
    typeof trip.tripName === "string" &&
    typeof trip.userName === "string" &&
    typeof trip.lastVisitedAt === "string"
  );
}

export function getSavedTrips(): SavedTrip[] {
  try {
    const stored = getAppStorageItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isSavedTrip)
      .sort((first, second) => Date.parse(second.lastVisitedAt) - Date.parse(first.lastVisitedAt))
      .slice(0, MAX_SAVED_TRIPS);
  } catch {
    return [];
  }
}

export function rememberTrip(trip: Omit<SavedTrip, "lastVisitedAt">) {
  try {
    const savedTrips = getSavedTrips().filter((savedTrip) => savedTrip.urlKey !== trip.urlKey);
    const nextSavedTrips: SavedTrip[] = [
      { ...trip, lastVisitedAt: new Date().toISOString() },
      ...savedTrips,
    ].slice(0, MAX_SAVED_TRIPS);

    setAppStorageItem(STORAGE_KEY, JSON.stringify(nextSavedTrips));
  } catch {
    // Brak dostępu do localStorage nie powinien blokować wejścia do wyjazdu.
  }
}
