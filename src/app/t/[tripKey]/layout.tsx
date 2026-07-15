import { notFound, redirect } from "next/navigation";
import { getTripParticipant, getTripByUrlKey, parseTripModules } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { TripRouteProvider } from "~/providers/trip-route-provider";

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

  return (
    <TripRouteProvider
      value={{
        tripId: trip.id,
        tripName: trip.name,
        urlKey: trip.url_key,
        userId: participant?.id ?? null,
        userName: participant?.name ?? null,
        isAdmin: participant?.is_admin ?? false,
        modules: parseTripModules(trip.modules),
      }}
    >
      {children}
    </TripRouteProvider>
  );
}
