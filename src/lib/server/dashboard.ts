import { format } from "date-fns";
import { calculateFinances, type FinanceMode } from "~/lib/finances";
import type { TripModules } from "~/lib/trip-config";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export type DashboardInsights = {
  schedule: {
    next: {
      id: string;
      title: string;
      eventDate: string;
      startTime: string | null;
      locationName: string | null;
    } | null;
    todayCount: number;
  };
  shopping: { open: number; completed: number };
  finances: { balance: number; entries: number };
  scoreboard: {
    leader: { name: string; score: number; color: string | null } | null;
    teams: number;
    activeChallenges: number;
    openPolls: number;
    participants: number;
  };
};

export async function getDashboardInsights({
  tripId,
  userId,
  modules,
  financeMode,
}: {
  tripId: string;
  userId: string;
  modules: TripModules;
  financeMode: FinanceMode;
}): Promise<DashboardInsights> {
  const insights: DashboardInsights = {
    schedule: { next: null, todayCount: 0 },
    shopping: { open: 0, completed: 0 },
    finances: { balance: 0, entries: 0 },
    scoreboard: { leader: null, teams: 0, activeChallenges: 0, openPolls: 0, participants: 0 },
  };
  const supabase = createServerSupabaseClient();
  const tasks: Array<Promise<void>> = [];

  if (modules.schedule) {
    tasks.push(
      (async () => {
        const today = format(new Date(), "yyyy-MM-dd");
        const { data, error } = await supabase
          .from("schedule_items")
          .select("id, title, event_date, start_time, location_name")
          .eq("trip_id", tripId)
          .gte("event_date", today)
          .order("event_date")
          .order("start_time")
          .limit(50);

        if (error) {
          console.error("Błąd podglądu harmonogramu w Bazie:", error);
          return;
        }

        const items = data ?? [];
        const next = items[0];
        insights.schedule.todayCount = items.filter((item) => item.event_date === today).length;
        insights.schedule.next = next
          ? {
              id: next.id,
              title: next.title,
              eventDate: next.event_date,
              startTime: next.start_time,
              locationName: next.location_name,
            }
          : null;
      })(),
    );
  }

  if (modules.shopping) {
    tasks.push(
      (async () => {
        const { data, error } = await supabase
          .from("shopping_list")
          .select("is_completed")
          .eq("trip_id", tripId);
        if (error) {
          console.error("Błąd podglądu zakupów w Bazie:", error);
          return;
        }
        insights.shopping.open = (data ?? []).filter((item) => !item.is_completed).length;
        insights.shopping.completed = (data ?? []).filter((item) => item.is_completed).length;
      })(),
    );
  }

  if (modules.finances) {
    tasks.push(
      (async () => {
        const [usersResult, expensesResult] = await Promise.all([
          supabase.from("users").select("id, name").eq("trip_id", tripId),
          supabase
            .from("expenses")
            .select("*, expense_shares(user_id, amount)")
            .eq("trip_id", tripId),
        ]);
        if (usersResult.error || expensesResult.error) {
          console.error(
            "Błąd podglądu finansów w Bazie:",
            usersResult.error ?? expensesResult.error,
          );
          return;
        }
        const expenses = expensesResult.data ?? [];
        const { balances } = calculateFinances(expenses, usersResult.data ?? [], financeMode);
        insights.finances.balance = balances[userId] ?? 0;
        insights.finances.entries = expenses.length;
      })(),
    );
  }

  if (modules.scoreboard || modules.quests) {
    tasks.push(
      (async () => {
        const [teamsResult, challengesResult, pollsResult, participantsResult] = await Promise.all([
          supabase
            .from("teams")
            .select("name, score, color_hex")
            .eq("trip_id", tripId)
            .order("score", { ascending: false }),
          supabase.from("game_challenges").select("id").eq("trip_id", tripId).eq("is_active", true),
          supabase.from("polls").select("id").eq("trip_id", tripId).eq("status", "open"),
          supabase.from("users").select("id").eq("trip_id", tripId),
        ]);

        if (teamsResult.error) console.error("Błąd podglądu wyników w Bazie:", teamsResult.error);
        if (challengesResult.error) {
          console.error("Błąd podglądu wyzwań w Bazie:", challengesResult.error);
        }
        if (pollsResult.error) console.error("Błąd podglądu głosowań w Bazie:", pollsResult.error);
        if (participantsResult.error) {
          console.error("Błąd podglądu uczestników w Bazie:", participantsResult.error);
        }

        const teams = teamsResult.data ?? [];
        const leader = teams[0];
        insights.scoreboard.teams = teams.length;
        insights.scoreboard.activeChallenges = challengesResult.data?.length ?? 0;
        insights.scoreboard.openPolls = pollsResult.data?.length ?? 0;
        insights.scoreboard.participants = participantsResult.data?.length ?? 0;
        insights.scoreboard.leader = leader
          ? {
              name: leader.name,
              score: leader.score ?? 0,
              color: leader.color_hex,
            }
          : null;
      })(),
    );
  }

  await Promise.all(tasks);
  return insights;
}
