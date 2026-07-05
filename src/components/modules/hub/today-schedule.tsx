// src/components/modules/hub/today-schedule.tsx
"use client";

import { Navigation, Home, Flame, ShoppingBasket } from "lucide-react";

// Tutaj wpisujemy plan tylko na nadchodzący / obecny dzień
const TODAY_SCHEDULE = [
  {
    time: "8:00",
    title: "Zbiórka i wyjazd",
    icon: Navigation,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    time: "12:30",
    title: "Zakwaterowanie",
    icon: Home,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    time: "14:00",
    title: "Zakupy",
    icon: ShoppingBasket,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    time: "16:00",
    title: "Zabawa",
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export function TodaySchedule() {
  return (
    <div className="bg-theme-card flex flex-col gap-4 rounded-2xl border border-white/5 p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-body text-theme-text text-lg font-semibold">Plan na dziś</h2>
        <span className="text-theme-primary bg-theme-primary/10 rounded-full px-2 py-0.5 font-mono text-xs font-bold tracking-wider uppercase">
          Wtorek
        </span>
      </div>

      <div className="relative flex flex-col gap-5 before:absolute before:inset-y-2 before:left-4.75 before:w-px before:bg-white/10">
        {TODAY_SCHEDULE.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <div key={i} className="relative z-10 flex gap-4">
              <div
                className={`bg-theme-card flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/5 shadow-sm ${ev.color}`}
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
