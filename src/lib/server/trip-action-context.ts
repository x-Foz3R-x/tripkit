import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient, hasSupabaseSecretKey } from "~/lib/supabase/server";

const TRIP_KEY_PATTERN = /^[0-9a-f]{12}$/;

export async function getTripActionContext(tripKey: string) {
  if (!TRIP_KEY_PATTERN.test(tripKey) || !hasSupabaseSecretKey()) return null;

  const session = await getTripSession(tripKey);
  if (!session?.userId || session.urlKey !== tripKey) return null;

  const supabase = createServerSupabaseClient();
  const { data: participant, error } = await supabase
    .from("users")
    .select("id, is_admin, team_id")
    .eq("id", session.userId)
    .eq("trip_id", session.tripId)
    .maybeSingle();

  if (error || !participant) return null;

  return { participant, session, supabase };
}
