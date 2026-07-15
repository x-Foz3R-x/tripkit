import { notFound, redirect } from "next/navigation";
import { ParticipantPicker } from "~/components/modules/auth/participant-picker";
import { getTripByUrlKey } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export default async function JoinTripPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  const trip = await getTripByUrlKey(tripKey);
  if (!trip) notFound();

  const session = await getTripSession(tripKey);
  if (!session || session.tripId !== trip.id) redirect("/?error=access-required");

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, user_pin")
    .eq("trip_id", trip.id)
    .order("name");

  if (error) throw error;

  return (
    <div className="animate-fade-in flex min-h-[80vh] items-center justify-center px-2 py-8">
      <ParticipantPicker
        tripKey={tripKey}
        tripName={trip.name}
        participants={(data ?? []).map((participant) => ({
          id: participant.id,
          name: participant.name,
          avatarUrl: participant.avatar_url,
          hasPin: participant.user_pin !== null,
        }))}
      />
    </div>
  );
}
