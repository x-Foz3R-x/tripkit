import { notFound, redirect } from "next/navigation";
import { FinancesScreen } from "~/components/modules/finances/finances-screen";
import { getTripByUrlKey, parseTripModules } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export default async function FinancesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripKey: string }>;
  searchParams: Promise<{ viewAs?: string }>;
}) {
  const { tripKey } = await params;
  const { viewAs } = await searchParams;
  const session = await getTripSession(tripKey);
  if (!session?.userId) redirect(`/t/${tripKey}/join`);

  const supabase = createServerSupabaseClient();
  const [trip, usersResult, expensesResult] = await Promise.all([
    getTripByUrlKey(tripKey),
    supabase.from("users").select("id, name, phone").eq("trip_id", session.tripId).order("name"),
    supabase
      .from("expenses")
      .select("*, expense_shares(user_id, amount)")
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

  const viewer = usersResult.data?.find((user) => user.id === session.userId);
  const requestedSubject = usersResult.data?.find((user) => user.id === viewAs);
  const subject = viewer && viewAs && requestedSubject ? requestedSubject : viewer;
  const canPreview = Boolean(
    viewAs &&
    requestedSubject &&
    (
      await supabase
        .from("users")
        .select("is_admin")
        .eq("id", session.userId)
        .eq("trip_id", session.tripId)
        .maybeSingle()
    ).data?.is_admin,
  );

  return (
    <FinancesScreen
      initialUsers={usersResult.data ?? []}
      initialExpenses={(expensesResult.data ?? []).filter((expense) => !expense.deleted_at)}
      subjectUserId={canPreview ? requestedSubject?.id : subject?.id}
      previewUserName={canPreview ? requestedSubject?.name : null}
    />
  );
}
