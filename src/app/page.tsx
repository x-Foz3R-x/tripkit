"use client";

import { WelcomeCard } from "~/components/modules/hub/welcome-card";
import { PlaylistCard } from "~/components/modules/hub/playlist-card";

export default function HomePage() {
  const tripName = "Stężyca 2026";

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <header className="flex flex-col gap-2 pt-4 pb-2">
        <h1 className="font-heading mt-1 mb-2 text-[3.5rem] leading-none tracking-wide text-white drop-shadow-sm">
          {tripName}
        </h1>

        <div className="from-theme-primary/60 h-px w-1/4 bg-linear-to-r to-transparent" />
      </header>

      {/* Kontener modułów Huba */}
      <section className="flex flex-col gap-5">
        <WelcomeCard />

        {/* Moduł Aktualności z wykorzystaniem Libertinus Mono */}
        <div className="bg-theme-card flex flex-col justify-center rounded-2xl border border-white/5 p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-body font-semibold text-white/90">Aktualności</p>
            {/* Wykorzystanie Twojego mono fontu do technicznego akcentu */}
            <span className="text-theme-primary bg-theme-primary/10 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase">
              Moduł Beta
            </span>
          </div>
          <p className="font-body text-theme-muted text-sm">
            Tutaj w przyszłości pojawią się najważniejsze powiadomienia (np. nierozliczone wydatki i
            zmiany w harmonogramie).
          </p>
        </div>

        <PlaylistCard />
      </section>
    </div>
  );
}
