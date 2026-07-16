import { notFound, redirect } from "next/navigation";
import { TripSettings } from "~/components/modules/settings/trip-settings";
import { getTripByUrlKey, getTripParticipant, getTripPlaylists } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";
import {
  parseGameplayDashboardWidgets,
  parseTripLayout,
  parseTripModules,
} from "~/lib/trip-config";
import { parseFinanceMode, parseSettlementStrategy } from "~/lib/finances";

export default async function SettingsPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  const session = await getTripSession(tripKey);
  if (!session?.userId) redirect(`/t/${tripKey}/join`);

  const [trip, participant] = await Promise.all([
    getTripByUrlKey(tripKey),
    getTripParticipant(session.tripId, session.userId),
  ]);

  if (!trip) notFound();
  if (session.tripId !== trip.id || !participant) redirect(`/t/${tripKey}/join`);

  const modules = parseTripModules(trip.modules);
  const layout = parseTripLayout(trip.layout_config, modules, trip.dashboard_widgets);
  const playlists = participant.is_admin
    ? await getTripPlaylists(trip.id, trip.playlist_url ?? null)
    : [];
  let participants: Array<{
    id: string;
    name: string;
    is_admin: boolean;
    last_seen_at: string | null;
    user_pin: string | null;
  }> = [];
  let financeEntryCount = 0;

  if (participant.is_admin) {
    const supabase = createServerSupabaseClient();
    const [participantsResult, financeEntriesResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, name, is_admin, last_seen_at, user_pin")
        .eq("trip_id", trip.id)
        .order("is_admin", { ascending: false })
        .order("name"),
      supabase.from("expenses").select("id", { count: "exact", head: true }).eq("trip_id", trip.id),
    ]);

    if (participantsResult.error) throw participantsResult.error;
    if (financeEntriesResult.error) throw financeEntriesResult.error;
    participants = participantsResult.data ?? [];
    financeEntryCount = financeEntriesResult.count ?? 0;
  }

  return (
    <TripSettings
      tripKey={tripKey}
      isAdmin={participant.is_admin}
      currentUserId={participant.id}
      initialProfile={{ name: participant.name, avatarUrl: participant.avatar_url ?? null }}
      initialTrip={{
        name: trip.name,
        startDate: trip.start_date,
        endDate: trip.end_date,
        destinationName: trip.destination_name ?? null,
        destinationAddress: trip.destination_address ?? null,
        destinationMapUrl: trip.destination_map_url ?? null,
        playlistUrl: trip.playlist_url ?? null,
        financeMode: parseFinanceMode(trip.finance_mode),
        settlementStrategy: parseSettlementStrategy(trip.settlement_strategy),
        playlists,
        modules,
        dashboardWidgets: parseGameplayDashboardWidgets(
          trip.dashboard_widgets,
          trip.layout_config,
          modules,
        ),
        navigation: layout.navigation,
        joinPin: participant.is_admin ? trip.join_pin : null,
        inviteToken: participant.is_admin ? trip.invite_token : null,
        financeEntryCount,
      }}
      participants={participants.map((user) => ({
        id: user.id,
        name: user.name,
        isAdmin: user.is_admin,
        lastSeenAt: user.last_seen_at ?? null,
        userPin: user.user_pin === null ? null : String(user.user_pin).padStart(4, "0"),
      }))}
    />
  );
}
