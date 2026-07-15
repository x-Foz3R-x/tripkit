import { Trophy, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { TeamsChart } from "~/components/modules/scoreboard/teams-chart";
import { WheelOfFortune } from "~/components/modules/scoreboard/wheel-of-fortune";
import { getTripByUrlKey, parseTripModules } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export default async function ScoreboardPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  const session = await getTripSession(tripKey);
  if (!session?.userId) redirect(`/t/${tripKey}/join`);

  const supabase = createServerSupabaseClient();
  const [trip, teamsResult, usersResult] = await Promise.all([
    getTripByUrlKey(tripKey),
    supabase
      .from("teams")
      .select("*")
      .eq("trip_id", session.tripId)
      .order("score", { ascending: false }),
    supabase.from("users").select("id, name, team_id").eq("trip_id", session.tripId).order("name"),
  ]);

  if (!trip) notFound();
  if (session.tripId !== trip.id) redirect(`/t/${tripKey}/join`);
  if (!parseTripModules(trip.modules).scoreboard) redirect(`/t/${tripKey}`);

  if (teamsResult.error) throw teamsResult.error;
  if (usersResult.error) throw usersResult.error;

  const teams = teamsResult.data ?? [];
  const users = usersResult.data ?? [];

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-theme-text text-5xl font-semibold">Scoreboard</h1>
        </div>
      </header>

      {/* --- WYNIKI --- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-theme-accent" />
          <h2 className="font-body text-theme-text text-lg font-bold">Wyniki</h2>
        </div>

        {teams.length === 0 ? (
          <div className="border-theme-border flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
            <span className="font-body text-theme-muted text-sm">Brak drużyn w bazie.</span>
          </div>
        ) : (
          <TeamsChart teams={teams} />
        )}
      </section>

      {users.length > 0 && (
        <section className="mt-2 flex flex-col gap-3">
          <WheelOfFortune users={users} />
        </section>
      )}

      {/* --- SKŁADY (Zwięzła sekcja) --- */}
      <section className="mt-2 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-theme-primary" />
          <h2 className="font-body text-theme-text text-lg font-bold">Skład drużyn</h2>
        </div>

        <div className="flex flex-col">
          {teams.map((team) => {
            const teamMembers = users.filter((u) => u.team_id === team.id);

            return (
              <div
                key={team.id}
                className="border-theme-border flex flex-col gap-1 border-b border-dashed py-3 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  {team.color_hex && (
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: team.color_hex }}
                    />
                  )}
                  <h3 className="font-heading text-theme-text text-lg font-semibold">
                    {team.name}
                  </h3>
                </div>

                <p className="font-body text-theme-text/70 text-sm">
                  {teamMembers.length > 0
                    ? teamMembers.map((member) => member.name).join(", ")
                    : "Brak zawodników"}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
