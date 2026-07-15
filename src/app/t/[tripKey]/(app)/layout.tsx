import { redirect } from "next/navigation";
import { BottomNav } from "~/components/bottom-nav";
import { getTripByUrlKey, getTripParticipant } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";

export default async function ProtectedTripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripKey: string }>;
}) {
  const { tripKey } = await params;
  const [trip, session] = await Promise.all([getTripByUrlKey(tripKey), getTripSession(tripKey)]);

  if (!trip || !session?.userId || session.tripId !== trip.id) {
    redirect(`/t/${tripKey}/join`);
  }

  const participant = await getTripParticipant(trip.id, session.userId);
  if (!participant) redirect(`/t/${tripKey}/join`);

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
