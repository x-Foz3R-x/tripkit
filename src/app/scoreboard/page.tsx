"use client";

import { useEffect, useState } from "react";
import { Trophy, Users } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import { Skeleton } from "~/components/ui/skeleton";
import { TeamsChart } from "~/components/modules/scoreboard/teams-chart";
import type { Database } from "~/types/database";

type Team = Database["public"]["Tables"]["teams"]["Row"];
// Pobieramy ID, imię i powiązanie z drużyną
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "team_id">;

export default function ScoreboardPage() {
  const [mounted, setMounted] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      setIsLoading(true);

      // Pobieramy równolegle drużyny ORAZ użytkowników
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

  // Filtrujemy graczy, którzy jeszcze nie mają przypisanej drużyny (opcjonalnie)
  const unassignedUsers = users.filter((u) => !u.team_id);

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-theme-text text-5xl font-semibold tracking-wide drop-shadow-sm">
            Scoreboard
          </h1>
        </div>
      </header>

      {/* --- SEKCJA 1: WYKRES WYNIKÓW --- */}
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

      {/* --- SEKCJA 2: SKŁADY DRUŻYN (Zamiast "Za co punkty") --- */}
      <section className="mt-2 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-theme-primary" />
          <h2 className="font-body text-theme-text text-lg font-bold">Skład drużyn</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {teams.map((team) => {
              // Szukamy członków konkretnej drużyny
              const teamMembers = users.filter((u) => u.team_id === team.id);

              return (
                <div
                  key={team.id}
                  className="bg-theme-card flex flex-col gap-2 rounded-2xl border border-white/5 p-4 shadow-sm transition-all hover:bg-white/5"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    {/* Wyświetlamy kolor drużyny, jeśli jest w bazie */}
                    {team.color_hex && (
                      <div
                        className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: team.color_hex }}
                      />
                    )}
                    <h3 className="font-heading text-xl tracking-wide text-white">{team.name}</h3>
                  </div>

                  <ul className="flex flex-col gap-1.5 pt-1 pl-1">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <li
                          key={member.id}
                          className="font-body flex items-center gap-2 text-[15px] font-medium text-white/80"
                        >
                          <div className="bg-theme-primary/50 h-1 w-1 rounded-full" />
                          {member.name}
                        </li>
                      ))
                    ) : (
                      <li className="font-body text-theme-muted/50 text-sm italic">
                        Brak zawodników
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
