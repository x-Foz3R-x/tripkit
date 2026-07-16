import { notFound, redirect } from "next/navigation";
import { Dashboard } from "~/components/modules/hub/dashboard";
import { getTripByUrlKey, getTripParticipant, getTripPlaylists } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import {
  getAutomaticDashboardWidgets,
  parseGameplayDashboardWidgets,
  parseTripModules,
} from "~/lib/trip-config";
import { getDashboardInsights } from "~/lib/server/dashboard";
import { parseFinanceMode } from "~/lib/finances";

export default async function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripKey: string }>;
}) {
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
  const financeMode = parseFinanceMode(trip.finance_mode);
  const [playlists, insights] = await Promise.all([
    getTripPlaylists(trip.id, trip.playlist_url ?? null),
    getDashboardInsights({ tripId: trip.id, userId: participant.id, modules, financeMode }),
  ]);
  const gameplayWidgets = parseGameplayDashboardWidgets(
    trip.dashboard_widgets,
    trip.layout_config,
    modules,
  );
  const dashboardWidgets = getAutomaticDashboardWidgets({
    modules,
    hasDestination: Boolean(trip.destination_name || trip.destination_address),
    gameplayWidgets,
  });

  return (
    <Dashboard
      tripName={trip.name}
      urlKey={trip.url_key}
      participant={{
        id: participant.id,
        name: participant.name,
        avatarUrl: participant.avatar_url,
      }}
      isAdmin={participant.is_admin}
      startDate={trip.start_date}
      endDate={trip.end_date}
      destinationName={trip.destination_name ?? null}
      destinationAddress={trip.destination_address ?? null}
      destinationMapUrl={trip.destination_map_url ?? null}
      playlists={playlists}
      modules={modules}
      financeMode={financeMode}
      dashboardWidgets={dashboardWidgets}
      insights={insights}
    />
  );
}
