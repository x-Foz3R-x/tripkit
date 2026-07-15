import { notFound, redirect } from "next/navigation";
import { Dashboard } from "~/components/modules/hub/dashboard";
import { getTripByUrlKey, getTripParticipant } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";

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

  const shareAccess = participant.is_admin
    ? { inviteToken: trip.invite_token, joinPin: trip.join_pin }
    : null;

  return (
    <Dashboard
      tripName={trip.name}
      urlKey={trip.url_key}
      participant={{ id: participant.id, name: participant.name }}
      shareAccess={shareAccess}
    />
  );
}
