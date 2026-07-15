import { cache } from "react";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import type { Json } from "~/types/database";

export type TripModules = {
  finances: boolean;
  shopping: boolean;
  scoreboard: boolean;
};

export function parseTripModules(value: Json | null): TripModules {
  const modules = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return {
    finances: modules.finances !== false,
    shopping: modules.shopping !== false,
    scoreboard: modules.scoreboard === true,
  };
}

export const getTripByUrlKey = cache(async (urlKey: string) => {
  if (!/^[0-9a-f]{12}$/.test(urlKey)) return null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, url_key, modules, theme, start_date, end_date, invite_token, join_pin")
    .eq("url_key", urlKey)
    .maybeSingle();

  if (error) throw error;
  return data;
});

export const getTripParticipant = cache(async (tripId: string, userId: string) => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, is_admin")
    .eq("id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error) throw error;
  return data;
});
