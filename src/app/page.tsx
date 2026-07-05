"use client";

import { MapPin, Navigation, CalendarClock, CloudSun } from "lucide-react";
import { WelcomeCard } from "~/components/modules/hub/welcome-card";
import { PlaylistCard } from "~/components/modules/hub/playlist-card";
import { TodaySchedule } from "~/components/modules/hub/today-schedule";
import { PackingWidget } from "~/components/modules/hub/packing-widget";

export default function HomePage() {
  const tripName = "Stężyca 2026";

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-8">
      <header className="flex flex-col gap-2 pt-4 pb-2">
        <h1 className="font-heading mt-1 mb-2 text-[3.5rem] leading-none tracking-wide text-white drop-shadow-sm">
          {tripName}
        </h1>

        <div className="from-theme-primary/60 h-px w-1/4 bg-linear-to-r to-transparent" />
      </header>

      <section className="flex flex-col gap-5">
        <WelcomeCard />

        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://maps.app.goo.gl/6fdknAP3NfDqZKAw7"
            target="_blank"
            rel="noopener noreferrer"
            className="border-theme-primary/20 bg-theme-primary/10 hover:bg-theme-primary/20 col-span-2 flex items-center justify-between rounded-2xl border p-4 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex flex-col gap-1.5">
              <span className="font-body text-theme-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                <MapPin size={14} /> Cel Podróży
              </span>
              <span className="font-body text-[15px] font-medium text-white/90">
                ul. Stolema 19, 83-322 Stężyca
              </span>
            </div>
            <div className="bg-theme-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md">
              <Navigation size={18} className="mr-0.5" />
            </div>
          </a>

          <div className="bg-theme-card col-span-1 flex flex-col gap-3 rounded-2xl border border-white/5 p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CalendarClock size={20} />
            </div>
            <div className="mt-1 flex flex-col">
              <span className="font-body text-theme-muted mb-0.5 text-xs">Start wyjazdu</span>
              <span className="font-body text-theme-text text-sm font-bold">Wtorek, 8:00</span>
            </div>
          </div>

          <div className="bg-theme-card col-span-1 flex flex-col gap-3 rounded-2xl border border-white/5 p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <CloudSun size={20} />
            </div>
            <div className="mt-1 flex flex-col">
              <span className="font-body text-theme-muted mb-0.5 text-xs">Prognoza</span>
              <span className="font-body text-theme-text text-sm font-bold">Deszcz i słońce</span>
            </div>
          </div>
        </div>

        <TodaySchedule />
        <PackingWidget />

        <PlaylistCard />
      </section>
    </div>
  );
}
