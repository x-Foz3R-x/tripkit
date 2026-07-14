"use client";

import { Music, Mic2, Flame } from "lucide-react";
import { Link } from "~/components/ui/link";

const PLAYLISTS = [
  {
    id: "p1",
    name: "Stężyca 2026",
    desc: "Nocne imprezy",
    icon: Flame,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    url: "https://music.youtube.com/playlist?list=PLFDibWJ7RcAQ&si=6bmR51WLYB_EQ11q",
  },
  {
    id: "p2",
    name: "Sielanka w Stężycy",
    desc: "Dzienny Chill i gry",
    icon: Music,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    url: "https://music.youtube.com/playlist?list=PLVHlKg-Xnp6g&si=wyYnb04-FzO9nZ6i",
  },
  {
    id: "p3",
    name: "Stężycowe karaoke",
    desc: "śpiewanki",
    icon: Mic2,
    color: "text-theme-accent",
    bg: "bg-theme-accent/10",
    url: "https://music.youtube.com/playlist?list=PLDK8IC3Ao8gY&si=c-_gv1hoSIn-tD8A",
  },
];

export function PlaylistWidget() {
  return (
    <div className="bg-theme-card border-theme-border flex flex-col gap-4 rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-body text-theme-text text-lg font-semibold">Stacja DJ-a</h2>
        <span className="bg-theme-primary/10 text-theme-primary rounded-full px-2 py-0.5 font-mono text-xs font-bold tracking-wider uppercase">
          YT Music
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {PLAYLISTS.map((pl) => {
          const Icon = pl.icon;
          return (
            <Link.Default
              key={pl.id}
              href={pl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-theme-bg/50 border-theme-border hover:border-theme-border hover:bg-theme-text/5 flex w-full items-start justify-start gap-3 rounded-xl border px-3 py-2"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${pl.bg} ${pl.color}`}
              >
                <Icon size={20} />
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="font-body text-theme-text text-sm leading-tight font-semibold">
                  {pl.name}
                </span>
                <span className="font-body text-theme-muted text-xs">{pl.desc}</span>
              </div>
            </Link.Default>
          );
        })}
      </div>
    </div>
  );
}
