"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient, hasSupabaseSecretKey } from "~/lib/supabase/server";

const playlistSchema = z.object({
  id: z.string().uuid().nullable(),
  tripKey: z.string().regex(/^[0-9a-f]{12}$/),
  name: z.string().trim().min(1).max(80),
  url: z.string().trim().url().max(1000),
});

const deletePlaylistSchema = z.object({
  id: z.string().uuid(),
  tripKey: z.string().regex(/^[0-9a-f]{12}$/),
});

type PlaylistResult = { ok: true } | { ok: false; error: string };

async function getAdminContext(tripKey: string) {
  if (!hasSupabaseSecretKey()) return null;
  const session = await getTripSession(tripKey);
  if (!session?.userId) return null;

  const supabase = createServerSupabaseClient();
  const { data: participant } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("id", session.userId)
    .eq("trip_id", session.tripId)
    .maybeSingle();

  if (!participant?.is_admin) return null;
  return { session, participantId: participant.id, supabase };
}

async function syncLegacyPlaylist(
  context: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>,
) {
  const { data: firstPlaylist } = await context.supabase
    .from("trip_playlists")
    .select("url")
    .eq("trip_id", context.session.tripId)
    .order("sort_order")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  await context.supabase
    .from("trips")
    .update({ playlist_url: firstPlaylist?.url ?? null })
    .eq("id", context.session.tripId);
}

function playlistError(code?: string) {
  return code && ["42P01", "PGRST205"].includes(code)
    ? "Uruchom migrację overhaul_foundation w Supabase, aby dodawać wiele playlist."
    : "Nie udało się zapisać playlisty.";
}

export async function savePlaylistAction(input: {
  id: string | null;
  tripKey: string;
  name: string;
  url: string;
}): Promise<PlaylistResult> {
  const parsed = playlistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Podaj nazwę i prawidłowy link." };

  const context = await getAdminContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Tylko administrator może zmieniać playlisty." };

  const result = parsed.data.id
    ? await context.supabase
        .from("trip_playlists")
        .update({
          name: parsed.data.name,
          url: parsed.data.url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsed.data.id)
        .eq("trip_id", context.session.tripId)
    : await context.supabase.from("trip_playlists").insert({
        trip_id: context.session.tripId,
        name: parsed.data.name,
        url: parsed.data.url,
        created_by: context.participantId,
      });

  if (result.error) return { ok: false, error: playlistError(result.error.code) };
  await syncLegacyPlaylist(context);
  revalidatePath(`/t/${parsed.data.tripKey}`, "layout");
  return { ok: true };
}

export async function deletePlaylistAction(input: {
  id: string;
  tripKey: string;
}): Promise<PlaylistResult> {
  const parsed = deletePlaylistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nieprawidłowa playlista." };

  const context = await getAdminContext(parsed.data.tripKey);
  if (!context) return { ok: false, error: "Tylko administrator może zmieniać playlisty." };

  const { error } = await context.supabase
    .from("trip_playlists")
    .delete()
    .eq("id", parsed.data.id)
    .eq("trip_id", context.session.tripId);

  if (error) return { ok: false, error: playlistError(error.code) };
  await syncLegacyPlaylist(context);
  revalidatePath(`/t/${parsed.data.tripKey}`, "layout");
  return { ok: true };
}
