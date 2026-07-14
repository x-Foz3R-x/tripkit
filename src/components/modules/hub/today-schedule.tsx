"use client";

import { Pizza, Waves, Flame, Volleyball } from "lucide-react";

const TODAY_SCHEDULE = [
  {
    time: "12:00",
    title: "Wyjazd na Basen",
    icon: Waves,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    time: "14:30",
    title: "Pizza na mieście",
    icon: Pizza,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    time: "17:00",
    title: "Wyjazd na MiniGolf",
    icon: Volleyball,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    time: "19:00",
    title: "Zabawa",
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export function TodayScheduleWidget() {
  return (
    <div className="bg-theme-card border-theme-border flex flex-col gap-4 rounded-2xl border p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-body text-theme-text text-lg font-semibold">Plan na dziś</h2>
        <span className="text-theme-primary bg-theme-primary/10 rounded-full px-2 py-0.5 font-mono text-xs font-bold tracking-wider uppercase">
          Czwartek, 9 lipca
        </span>
      </div>

      <div className="before:bg-theme-text/10 relative flex flex-col gap-5 before:absolute before:inset-y-2 before:left-4.75 before:w-px">
        {TODAY_SCHEDULE.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <div key={i} className="relative z-10 flex gap-4">
              <div
                className={`bg-theme-card border-theme-border flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm ${ev.color}`}
              >
                <div
                  className={`flex h-full w-full items-center justify-center rounded-full ${ev.bg}`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="text-theme-muted font-mono text-xs font-bold">{ev.time}</span>
                <span className="font-body text-theme-text text-sm font-bold">{ev.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
