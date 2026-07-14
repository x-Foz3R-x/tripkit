"use client";

import { useState, useEffect } from "react";
import { Flame, Home, Navigation } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

// Placeholderowe dane - łatwo je później podmienić lub przenieść do bazy
const SCHEDULE_DATA = [
  {
    date: "Wtorek, 7 Lipca",
    events: [
      {
        time: "16:00",
        title: "Zbiórka i wyjazd",
        description: "Pakujemy się do aut i ruszamy w drogę. Nie zapomnijcie prowiantu!",
        icon: Navigation,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
      },
      {
        time: "18:00",
        title: "Zakwaterowanie",
        description: "Rozdzielanie łóżek (kto pierwszy, ten lepszy) i rozpakowanie tobołków.",
        icon: Home,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
      },
      {
        time: "20:00",
        title: "Ognisko i integracja",
        description: "Otwieramy sezon. Pieczemy kiełbaski i zaczynamy nasz turniej.",
        icon: Flame,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
      },
    ],
  },
  {
    date: "Środa, 8 Lipca",
    events: [],
  },
  {
    date: "Czwartek, 9 Lipca",
    events: [],
  },
  {
    date: "Piątek, 10 Lipca",
    events: [],
  },
  {
    date: "Sobota, 11 Lipca",
    events: [],
  },
  {
    date: "Niedziela, 12 Lipca",
    events: [],
  },
];

export default function SchedulePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 px-4 pt-4 pb-24">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-theme-text text-5xl font-semibold">Plan Wyjazdu</h1>
        </div>
      </header>

      <section className="flex flex-col gap-8">
        {SCHEDULE_DATA.map((day, dayIndex) => (
          <div key={dayIndex} className="flex flex-col">
            {/* Nagłówek Dnia */}
            <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 py-2 backdrop-blur-md">
              <div className="bg-theme-text/10 h-px flex-1" />
              <h2 className="font-body text-theme-muted text-sm font-bold tracking-widest uppercase">
                {day.date}
              </h2>
              <div className="bg-theme-text/10 h-px flex-1" />
            </div>

            {/* Oś czasu dla konkretnego dnia */}
            <div className="flex flex-col px-2">
              {day.events.map((ev, i) => {
                const Icon = ev.icon;
                const isLast = i === day.events.length - 1;

                return (
                  <div key={i} className="group flex gap-4">
                    {/* Lewa kolumna: Czas i Oś */}
                    <div className="flex flex-col items-center">
                      {/* Pasek łączący w górę (ukryty dla pierwszego elementu dnia, by ładniej wyglądało, albo widoczny zależnie od preferencji) */}
                      <div className={`bg-theme-text/10 w-px ${i === 0 ? "h-2" : "h-full"}`} />

                      {/* Kółko z ikoną */}
                      <div
                        className={`border-theme-border relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-transform duration-300 group-hover:scale-110 ${ev.bg} ${ev.color}`}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Pasek łączący w dół */}
                      <div
                        className={`bg-theme-text/10 w-px ${isLast ? "h-2" : "h-full min-h-10"}`}
                      />
                    </div>

                    {/* Prawa kolumna: Treść */}
                    <div className="flex flex-col pt-1 pb-6">
                      <span className="text-theme-text/80 mb-0.5 font-mono text-sm font-bold">
                        {ev.time}
                      </span>
                      <div className="bg-theme-card border-theme-border hover:bg-theme-text/5 flex flex-col rounded-2xl border p-4 shadow-sm transition-all">
                        <h3 className="font-body text-theme-text text-lg font-bold">{ev.title}</h3>
                        <p className="font-body text-theme-muted mt-1 text-sm">{ev.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
