import { MapPin, Navigation } from "lucide-react";
import { WelcomeCard } from "~/components/modules/hub/welcome-card";
import { PlaylistWidget } from "~/components/modules/hub/playlist-card";
import { TodayScheduleWidget } from "~/components/modules/hub/today-schedule";
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
        </div>

        <TodayScheduleWidget />
        <PackingWidget />
        <PlaylistWidget />
      </section>
    </div>
  );
}
