import { notFound, redirect } from "next/navigation";
import { ScheduleScreen } from "~/components/modules/schedule/schedule-screen";
import { getTripByUrlKey, getTripParticipant, parseTripModules } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export default async function SchedulePage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  const session = await getTripSession(tripKey);
  if (!session?.userId) redirect(`/t/${tripKey}/join`);

  const supabase = createServerSupabaseClient();
  const [trip, participant, scheduleResult] = await Promise.all([
    getTripByUrlKey(tripKey),
    getTripParticipant(session.tripId, session.userId),
    supabase
      .from("schedule_items")
      .select("*")
      .eq("trip_id", session.tripId)
      .order("event_date")
      .order("start_time", { nullsFirst: false }),
  ]);

  if (!trip) notFound();
  if (session.tripId !== trip.id || !participant) redirect(`/t/${tripKey}/join`);
  if (!parseTripModules(trip.modules).schedule) redirect(`/t/${tripKey}`);

  const missingTable = ["42P01", "PGRST205"].includes(scheduleResult.error?.code ?? "");
  if (scheduleResult.error && !missingTable) throw scheduleResult.error;

  return (
    <ScheduleScreen
      tripKey={tripKey}
      isAdmin={participant.is_admin}
      items={scheduleResult.data ?? []}
      databaseReady={!missingTable}
      tripStartDate={trip.start_date}
    />
  );
}
