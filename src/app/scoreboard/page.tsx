"use client";

import { useEffect, useState } from "react";
import { Trophy, ScrollText } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import { Skeleton } from "~/components/ui/skeleton";
import { TeamsChart } from "~/components/modules/scoreboard/teams-chart";
import type { Database } from "~/types/database";

type Team = Database["public"]["Tables"]["teams"]["Row"];

export default function ScoreboardPage() {
  const [mounted, setMounted] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchTeams = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("trip_id", env.NEXT_PUBLIC_TRIP_ID)
        .order("score", { ascending: false });

      if (error) {
        console.error("Błąd pobierania drużyn:", error);
      } else if (data) {
        setTeams(data);
      }
      setIsLoading(false);
    };

    void fetchTeams();
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

      {/* --- ZASADY GRY --- */}
      <section className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-theme-primary" />
          <h2 className="font-body text-theme-text text-lg font-bold">Za co punkty?</h2>
        </div>

        <ul className="font-body text-theme-text/90 flex flex-col gap-3">
          <li className="flex items-center gap-3">
            <span className="flex w-12 shrink-0 items-center justify-center rounded bg-emerald-500/10 px-2 py-1 font-mono text-sm font-bold text-emerald-400">
              +4
            </span>
            <span>za 1 miejsce.</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex w-12 shrink-0 items-center justify-center rounded bg-emerald-500/10 px-2 py-1 font-mono text-sm font-bold text-emerald-400">
              +2
            </span>
            <span>za 2 miejsce.</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex w-12 shrink-0 items-center justify-center rounded bg-emerald-500/10 px-2 py-1 font-mono text-sm font-bold text-emerald-400">
              +1
            </span>
            <span>za 3 miejsce.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
