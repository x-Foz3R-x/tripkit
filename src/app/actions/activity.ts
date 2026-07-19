"use server";

import { z } from "zod";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient, hasSupabaseSecretKey } from "~/lib/supabase/server";

const tripKeySchema = z.string().regex(/^[0-9a-f]{12}$/);

export async function touchParticipantActivityAction(tripKey: string) {
  const parsed = tripKeySchema.safeParse(tripKey);
  if (!parsed.success || !hasSupabaseSecretKey()) return;

  const session = await getTripSession(parsed.data);
  if (!session?.userId) return;

  const supabase = createServerSupabaseClient();
  await supabase
    .from("users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", session.userId)
    .eq("trip_id", session.tripId);
}
