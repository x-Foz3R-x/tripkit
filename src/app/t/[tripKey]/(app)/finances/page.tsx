import { notFound, redirect } from "next/navigation";
import { FinancesScreen } from "~/components/modules/finances/finances-screen";
import { getTripByUrlKey, parseTripModules } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export default async function FinancesPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  const session = await getTripSession(tripKey);
  if (!session?.userId) redirect(`/t/${tripKey}/join`);

  const supabase = createServerSupabaseClient();
  const [trip, usersResult, expensesResult] = await Promise.all([
    getTripByUrlKey(tripKey),
    supabase.from("users").select("id, name, phone").eq("trip_id", session.tripId).order("name"),
    supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", session.tripId)
      .order("created_at", { ascending: false }),
  ]);

  if (!trip) notFound();
  if (session.tripId !== trip.id) redirect(`/t/${tripKey}/join`);
  if (!parseTripModules(trip.modules).finances) {
    return <FinancesScreen initialExpenses={[]} initialUsers={[]} />;
  }

  if (usersResult.error) throw usersResult.error;
  if (expensesResult.error) throw expensesResult.error;

  return (
    <FinancesScreen
      initialUsers={usersResult.data ?? []}
      initialExpenses={expensesResult.data ?? []}
    />
  );
}
