import { format } from "date-fns";
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
    activePoll: {
      id: string;
      question: string;
      options: Array<{ id: string; label: string }>;
      ownOptionId: string | null;
    } | null;
  };
};

export async function getDashboardInsights({
  tripId,
  modules,
}: {
  tripId: string;
  modules: TripModules;
}): Promise<DashboardInsights> {
  const insights: DashboardInsights = {
    schedule: { next: null, todayCount: 0 },
    shopping: { open: 0, completed: 0 },
    finances: { balance: 0, entries: 0 },
    scoreboard: {
      leader: null,
      teams: 0,
      activeChallenges: 0,
      openPolls: 0,
      participants: 0,
      activePoll: null,
    },
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
        const next = items.find((item) => item.event_date === today);
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

  await Promise.all(tasks);
  return insights;
}
