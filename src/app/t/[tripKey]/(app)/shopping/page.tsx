import { notFound, redirect } from "next/navigation";
import { ShoppingScreen } from "~/components/modules/shopping/shopping-screen";
import { getTripByUrlKey, parseTripModules } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export default async function ShoppingPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  const session = await getTripSession(tripKey);
  if (!session?.userId) redirect(`/t/${tripKey}/join`);

  const supabase = createServerSupabaseClient();
  const [trip, usersResult, shoppingResult] = await Promise.all([
    getTripByUrlKey(tripKey),
    supabase
      .from("users")
      .select("id, name, avatar_url")
      .eq("trip_id", session.tripId)
      .order("name"),
    supabase.from("shopping_list").select("*").eq("trip_id", session.tripId).order("created_at"),
  ]);

  if (!trip) notFound();
  if (session.tripId !== trip.id) redirect(`/t/${tripKey}/join`);
  if (!parseTripModules(trip.modules).shopping) {
    return <ShoppingScreen initialItems={[]} initialUsers={[]} />;
  }

  if (usersResult.error) throw usersResult.error;
  if (shoppingResult.error) throw shoppingResult.error;

  return (
    <ShoppingScreen
      initialUsers={usersResult.data ?? []}
      initialItems={shoppingResult.data ?? []}
    />
  );
}
