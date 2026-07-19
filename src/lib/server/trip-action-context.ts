import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient, hasSupabaseSecretKey } from "~/lib/supabase/server";

const TRIP_KEY_PATTERN = /^[0-9a-f]{12}$/;

export async function getTripActionContext(tripKey: string) {
  if (!TRIP_KEY_PATTERN.test(tripKey) || !hasSupabaseSecretKey()) return null;

  const session = await getTripSession(tripKey);
  if (!session?.userId || session.urlKey !== tripKey) return null;

  const supabase = createServerSupabaseClient();
  const [{ data: participant, error }, tripResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, is_admin, team_id")
      .eq("id", session.userId)
      .eq("trip_id", session.tripId)
      .maybeSingle(),
    supabase
      .from("trips")
      .select("id, status")
      .eq("id", session.tripId)
      .eq("url_key", tripKey)
      .maybeSingle(),
  ]);

  if (error || !participant) return null;

  let trip = tripResult.data;
  if (tripResult.error && ["42703", "PGRST204"].includes(tripResult.error.code)) {
    const fallback = await supabase
      .from("trips")
      .select("id")
      .eq("id", session.tripId)
      .eq("url_key", tripKey)
      .maybeSingle();
    if (fallback.error || !fallback.data) return null;
    trip = { id: fallback.data.id, status: "active" };
  }

  if (tripResult.error && !["42703", "PGRST204"].includes(tripResult.error.code)) return null;
  if (!trip) return null;

  return { participant, session, supabase, trip, isClosed: trip.status === "closed" };
}

export function closedTripMutationError(context: {
  isClosed: boolean;
}): { ok: false; error: string } | null {
  return context.isClosed
    ? {
        ok: false,
        error: "Ten wyjazd został zamknięty przez Zarządcę i jest dostępny tylko do wglądu.",
      }
    : null;
}
