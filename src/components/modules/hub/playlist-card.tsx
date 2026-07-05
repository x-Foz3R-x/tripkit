"use client";

import { Music, Mic2, Flame } from "lucide-react";

// Mock linków (możesz tu wkleić swoje prawdziwe linki do YouTube Music)
const PLAYLISTS = [
  {
    id: "p1",
    name: "Sielanka Vibes",
    desc: "Chill, dzień, gry",
    icon: Music,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    url: "https://music.youtube.com",
  },
  {
    id: "p2",
    name: "Złote Gardła",
    desc: "Ognisko, śpiewanki",
    icon: Mic2,
    color: "text-accent",
    bg: "bg-accent/10",
    url: "https://music.youtube.com",
  },
  {
    id: "p3",
    name: "Nocny Sabotaż",
    desc: "Impreza i balet",
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-400/10",
    url: "https://music.youtube.com",
  },
];

export function PlaylistCard() {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-2xl border border-white/5 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-text text-lg font-semibold">Stacja DJ-a</h2>
        <span className="text-primary text-xs font-medium tracking-wider uppercase">YT Music</span>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {PLAYLISTS.map((pl) => {
          const Icon = pl.icon;
          return (
            <a
              key={pl.id}
              href={pl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-witch-bg/50 focus:ring-primary/50 flex min-w-[140px] flex-col gap-3 rounded-xl border border-white/5 p-4 transition-colors hover:bg-white/5 focus:ring-2 focus:outline-none"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${pl.bg} ${pl.color}`}
              >
                <Icon size={20} />
              </div>
              <div>
                <p className="text-text text-sm font-semibold">{pl.name}</p>
                <p className="text-muted text-xs">{pl.desc}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
