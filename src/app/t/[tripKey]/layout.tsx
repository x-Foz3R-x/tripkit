import { notFound, redirect } from "next/navigation";
import {
  getTripParticipant,
  getTripByUrlKey,
  getTripPlaylists,
  parseTripModules,
} from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { TripRouteProvider } from "~/providers/trip-route-provider";
import { parseTripLayout } from "~/lib/trip-config";
import { ActivityPing } from "~/components/activity-ping";
import { RememberTrip } from "~/components/remember-trip";
import { parseFinanceMode, parseSettlementStrategy } from "~/lib/finances";

export const dynamic = "force-dynamic";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripKey: string }>;
}) {
  const { tripKey } = await params;
  const [trip, session] = await Promise.all([getTripByUrlKey(tripKey), getTripSession(tripKey)]);
  if (!trip) notFound();

  if (!session || session.tripId !== trip.id) redirect("/?error=access-required");

  const participant = session.userId ? await getTripParticipant(trip.id, session.userId) : null;
  const playlists = await getTripPlaylists(trip.id, trip.playlist_url ?? null);

  const modules = parseTripModules(trip.modules);

  return (
    <TripRouteProvider
      value={{
        tripId: trip.id,
        tripName: trip.name,
        urlKey: trip.url_key,
        userId: participant?.id ?? null,
        userName: participant?.name ?? null,
        userAvatarUrl: participant?.avatar_url ?? null,
        isAdmin: participant?.is_admin ?? false,
        financeMode: parseFinanceMode(trip.finance_mode),
        settlementStrategy: parseSettlementStrategy(trip.settlement_strategy),
        modules,
        layout: parseTripLayout(trip.layout_config, modules, trip.dashboard_widgets),
        playlistUrl: trip.playlist_url ?? null,
        playlists,
        shareAccess: participant?.is_admin
          ? { inviteToken: trip.invite_token, joinPin: trip.join_pin }
          : null,
      }}
    >
      {participant && (
        <>
          <ActivityPing tripKey={tripKey} />
          <RememberTrip tripName={trip.name} urlKey={trip.url_key} userName={participant.name} />
        </>
      )}
      {children}
    </TripRouteProvider>
  );
}
