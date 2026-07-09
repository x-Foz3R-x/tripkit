// src/app/scoreboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Trophy, Users } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import { Skeleton } from "~/components/ui/skeleton";
import { TeamsChart } from "~/components/modules/scoreboard/teams-chart";
import { WheelOfFortune } from "~/components/modules/scoreboard/wheel-of-fortune";
import type { Database } from "~/types/database";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "team_id"> & {
  color_hex?: string | null;
};

export default function ScoreboardPage() {
  const [mounted, setMounted] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      setIsLoading(true);

      const [teamsRes, usersRes] = await Promise.all([
        supabase
          .from("teams")
          .select("*")
          .eq("trip_id", env.NEXT_PUBLIC_TRIP_ID)
          .order("score", { ascending: false }),
        supabase
          .from("users")
          .select("id, name, team_id")
          .eq("trip_id", env.NEXT_PUBLIC_TRIP_ID)
          .order("name"),
      ]);

      if (teamsRes.error) {
        console.error("Błąd pobierania drużyn:", teamsRes.error);
      } else if (teamsRes.data) {
        setTeams(teamsRes.data);
      }

      if (usersRes.error) {
        console.error("Błąd pobierania graczy:", usersRes.error);
      } else if (usersRes.data) {
        setUsers(usersRes.data);
      }

      setIsLoading(false);
    };

    void fetchData();
  }, []);

  if (!mounted) return null;

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-theme-text text-5xl font-semibold tracking-wide drop-shadow-sm">
            Scoreboard
          </h1>
        </div>
      </header>

      {/* --- WYNIKI --- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-theme-accent" />
          <h2 className="font-body text-theme-text text-lg font-bold">Wyniki</h2>
        </div>

        {isLoading ? (
          <Skeleton className="h-71 w-full rounded-2xl" />
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
            <span className="font-body text-theme-muted text-sm">Brak drużyn w bazie.</span>
          </div>
        ) : (
          <TeamsChart teams={teams} />
        )}
      </section>

      {!isLoading && users.length > 0 && (
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

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex flex-col">
            {teams.map((team) => {
              const teamMembers = users.filter((u) => u.team_id === team.id);

              return (
                <div
                  key={team.id}
                  className="flex flex-col gap-1 border-b border-dashed border-white/10 py-3 first:pt-0 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    {team.color_hex && (
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: team.color_hex }}
                      />
                    )}
                    <h3 className="font-heading text-lg tracking-wide text-white">{team.name}</h3>
                  </div>

                  <p className="font-body text-sm text-white/70">
                    {teamMembers.length > 0
                      ? teamMembers.map((m) => m.name).join(", ")
                      : "Brak zawodników"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
