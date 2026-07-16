import { Trophy, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { GameHub } from "~/components/modules/scoreboard/game-hub";
import { TeamsChart } from "~/components/modules/scoreboard/teams-chart";
import { WheelOfFortune } from "~/components/modules/scoreboard/wheel-of-fortune";
import {
  parseGameplayDashboardWidgets,
  parseTripModules,
  type GameplayDashboardWidgetKey,
} from "~/lib/trip-config";
import { getTripByUrlKey } from "~/lib/server/trips";
import { getTripSession } from "~/lib/server/trip-session";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export default async function ScoreboardPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  const session = await getTripSession(tripKey);
  if (!session?.userId) redirect(`/t/${tripKey}/join`);

  const trip = await getTripByUrlKey(tripKey);
  if (!trip) notFound();
  if (session.tripId !== trip.id) redirect(`/t/${tripKey}/join`);

  const modules = parseTripModules(trip.modules);
  if (!modules.scoreboard) redirect(`/t/${tripKey}`);

  const features = parseGameplayDashboardWidgets(
    trip.dashboard_widgets,
    trip.layout_config,
    modules,
  );
  const showScores = features.includes("scoreboard");
  const showChallenges = features.includes("quests");
  const showPolls = features.includes("polls");
  const showWheel = features.includes("wheel");

  const supabase = createServerSupabaseClient();
  const [teamsResult, usersResult, challengesResult, pollsResult] = await Promise.all([
    showScores
      ? supabase
          .from("teams")
          .select("*")
          .eq("trip_id", session.tripId)
          .order("score", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("users")
      .select("id, name, team_id, is_admin")
      .eq("trip_id", session.tripId)
      .order("name"),
    showChallenges
      ? supabase
          .from("game_challenges")
          .select("*")
          .eq("trip_id", session.tripId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    showPolls
      ? supabase
          .from("polls")
          .select("*")
          .eq("trip_id", session.tripId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (usersResult.error) throw usersResult.error;
  if (challengesResult.error) throw challengesResult.error;
  if (pollsResult.error) throw pollsResult.error;

  const teams = teamsResult.data ?? [];
  const users = usersResult.data ?? [];
  const challenges = (challengesResult.data ?? []).filter(
    (challenge) => showScores || challenge.audience === "individual",
  );
  const polls = pollsResult.data ?? [];
  const challengeIds = challenges.map((challenge) => challenge.id);
  const pollIds = polls.map((poll) => poll.id);
  const [entriesResult, optionsResult, votesResult] = await Promise.all([
    challengeIds.length > 0
      ? supabase
          .from("game_challenge_entries")
          .select("*")
          .in("challenge_id", challengeIds)
          .order("claimed_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    pollIds.length > 0
      ? supabase.from("poll_options").select("*").in("poll_id", pollIds).order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    pollIds.length > 0
      ? supabase.from("poll_votes").select("poll_id, option_id, user_id").in("poll_id", pollIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (entriesResult.error) throw entriesResult.error;
  if (optionsResult.error) throw optionsResult.error;
  if (votesResult.error) throw votesResult.error;

  const activeParticipant = users.find((user) => user.id === session.userId);
  if (!activeParticipant) redirect(`/t/${tripKey}/join`);

  const pollCounts = Object.entries(
    (votesResult.data ?? []).reduce<Record<string, number>>((counts, vote) => {
      counts[vote.option_id] = (counts[vote.option_id] ?? 0) + 1;
      return counts;
    }, {}),
  ).map(([optionId, count]) => ({ optionId, count }));

  const ownVotes = Object.fromEntries(
    (votesResult.data ?? [])
      .filter((vote) => vote.user_id === session.userId)
      .map((vote) => [vote.poll_id, vote.option_id]),
  );

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-7">
      <header className="mt-3 px-1 pt-1">
        <p className="text-theme-accent text-[10px] font-bold tracking-[0.2em] uppercase">
          Strefa ekipy
        </p>
        <h1 className="font-heading text-theme-text mt-1 text-4xl leading-tight font-semibold">
          {getGameplayTitle(features)}
        </h1>
      </header>

      {(showChallenges || showPolls) && (
        <GameHub
          challenges={challenges}
          challengeEntries={entriesResult.data ?? []}
          polls={polls}
          pollOptions={optionsResult.data ?? []}
          pollCounts={pollCounts}
          ownVotes={ownVotes}
          participants={users}
          teams={teams}
          activeUserId={activeParticipant.id}
          activeTeamId={activeParticipant.team_id}
          isAdmin={activeParticipant.is_admin}
          showChallenges={showChallenges}
          showPolls={showPolls}
          allowTeams={showScores}
          usesPoints={showScores}
        />
      )}

      {showWheel && users.length > 0 && <WheelOfFortune users={users} />}

      {showScores && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-theme-primary text-[10px] font-bold tracking-[0.18em] uppercase">
                Punktacja
              </p>
              <h2 className="font-heading text-theme-text text-2xl font-semibold">Wyniki drużyn</h2>
            </div>
            {teams[0] && (
              <span className="text-theme-muted text-right text-[10px]">
                Prowadzi
                <strong className="text-theme-text block text-xs">{teams[0].name}</strong>
              </span>
            )}
          </div>

          {teams.length === 0 ? (
            <div className="border-theme-border bg-theme-card/40 rounded-2xl border px-5 py-10 text-center">
              <Trophy className="text-theme-muted mx-auto" size={22} />
              <p className="text-theme-text mt-3 text-sm font-bold">Jeszcze bez drużyn</p>
              <p className="text-theme-muted mt-1 text-xs">
                Wyłącz Punktację w ustawieniach albo dodaj drużyny uczestnikom.
              </p>
            </div>
          ) : (
            <TeamsChart teams={teams} />
          )}
        </section>
      )}

      {showScores && teams.length > 0 && (
        <details className="border-theme-border bg-theme-card/45 group rounded-2xl border">
          <summary className="text-theme-text flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 text-sm font-bold">
            <Users className="text-theme-primary" size={18} />
            Składy drużyn
            <span className="text-theme-muted ml-auto text-[10px] font-medium">{teams.length}</span>
          </summary>
          <div className="border-theme-border divide-theme-border divide-y border-t px-4 py-1">
            {teams.map((team) => {
              const teamMembers = users.filter((user) => user.team_id === team.id);
              return (
                <div key={team.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: team.color_hex ?? "var(--theme-primary)" }}
                    />
                    <p className="text-theme-text text-sm font-bold">{team.name}</p>
                  </div>
                  <p className="text-theme-muted mt-1 pl-4.5 text-xs">
                    {teamMembers.length > 0
                      ? teamMembers.map((member) => member.name).join(", ")
                      : "Brak osób w drużynie"}
                  </p>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

function getGameplayTitle(features: GameplayDashboardWidgetKey[]) {
  const onlyDecisions =
    features.length > 0 && features.every((feature) => feature === "polls" || feature === "wheel");
  if (onlyDecisions) return "Głosuj i losuj";
  if (features.length === 1 && features[0] === "scoreboard") return "Wyniki rozgrywki";
  if (features.includes("quests")) return "Podejmij wyzwanie";
  return "Rozgrywka wyjazdu";
}
