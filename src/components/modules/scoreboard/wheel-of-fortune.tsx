// src/components/modules/scoreboard/wheel-of-fortune.tsx
"use client";

import { memo, useState, useMemo } from "react";
import { Dices, RefreshCw, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Database } from "~/types/database";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "team_id"> & {
  color_hex?: string | null;
};

interface WheelOfFortuneProps {
  users: User[];
}

const FALLBACK_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#d946ef", // fuchsia
  "#a855f7", // purple
  "#f43f5e", // rose
];

export const WheelOfFortune = memo(function WheelOfFortune({ users }: WheelOfFortuneProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<User | null>(null);
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);

  // Filtrujemy tylko tych, którzy aktywnie biorą udział w losowaniu
  const activeUsers = useMemo(
    () => users.filter((u) => !excludedUserIds.includes(u.id)),
    [users, excludedUserIds],
  );

  const numUsers = activeUsers.length;
  const sliceAngle = numUsers > 0 ? 360 / numUsers : 0;

  const handleToggleUser = (userId: string) => {
    if (isSpinning) return;
    setExcludedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleReset = () => {
    if (isSpinning) return;
    setExcludedUserIds([]);
    setWinner(null);
    setRotation(0);
  };

  const handleSpin = () => {
    if (isSpinning || numUsers === 0) return;

    setIsSpinning(true);
    setWinner(null);

    const spins = Math.floor(Math.random() * 4) + 5;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotation + spins * 360 + randomAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      const pointerAngle = (360 - normalizedRotation) % 360;
      const winningIndex = Math.floor(pointerAngle / sliceAngle);

      const currentWinner = activeUsers[winningIndex];

      if (currentWinner) {
        setWinner(currentWinner);
        setExcludedUserIds((prev) => [...prev, currentWinner.id]);
      }

      setIsSpinning(false);
    }, 4000);
  };

  // Generowanie kolorów koła
  const gradientStops = activeUsers
    .map((user, i) => {
      let bgColor = user.color_hex;

      if (!bgColor) {
        let colorIndex = i;
        // Zabezpieczenie przed łączeniem tego samego koloru przy nieparzystej liczbie
        if (numUsers % 2 !== 0 && i === numUsers - 1 && numUsers > 1) {
          colorIndex = i + 1;
        }
        bgColor = FALLBACK_COLORS[colorIndex % FALLBACK_COLORS.length];
      }

      const startAngle = i * sliceAngle;
      // Dodajemy +1deg do kąta końcowego, by ukryć białe artefakty wynikające z wygładzania krawędzi przeglądarki
      const endAngle = (i + 1) * sliceAngle + 1;

      return `${bgColor} ${startAngle}deg ${endAngle}deg`;
    })
    .join(", ");

  const wheelBackground = numUsers > 0 ? `conic-gradient(${gradientStops})` : "#1e1e24";

  if (users.length === 0) return null;

  return (
    <div className="bg-theme-card flex flex-col items-center gap-6 rounded-2xl border border-white/5 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-white">
        <Dices className="text-theme-accent" size={24} />
        <h3 className="font-heading text-xl tracking-wide">Koło Fortuny</h3>
      </div>

      <div className="relative mt-2 flex items-center justify-center">
        {/* Wskaźnik (strzałka) na górze koła */}
        <div className="absolute -top-4 z-10 flex flex-col items-center drop-shadow-md">
          <div className="h-4 w-4 rotate-45 rounded-sm bg-white shadow-sm" />
        </div>

        {/* Główne koło */}
        <div
          className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-white/10 shadow-xl transition-transform duration-4000 ease-[cubic-bezier(0.15,0.85,0.35,1)]"
          style={{
            transform: `rotate(${rotation}deg)`,
            background: wheelBackground,
          }}
        >
          {/* Napisy użytkowników */}
          {activeUsers.map((user, i) => {
            const labelRotation = i * sliceAngle + sliceAngle / 2;
            return (
              <div
                key={user.id}
                // Kontener tekstu zaczyna się na środku koła i sięga krawędzi (z przerwą pr-3, by tekst nie dotykał obwódki)
                className="absolute top-1/2 left-1/2 flex h-8 w-29 origin-left -translate-y-1/2 items-center justify-end pr-3"
                style={{ transform: `rotate(${labelRotation - 90}deg)` }}
              >
                <span className="truncate text-[11px] font-bold tracking-widest text-white uppercase drop-shadow-md">
                  {user.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Komunikat o wygranej */}
      <div className="flex h-12 flex-col items-center justify-center">
        {winner ? (
          <div className="animate-fade-in flex flex-col items-center text-center">
            <span className="text-theme-muted text-xs font-bold tracking-wider uppercase">
              Wylosowano:
            </span>
            <span className="text-theme-primary font-heading text-2xl font-bold tracking-widest">
              {winner.name}!
            </span>
          </div>
        ) : (
          <span className="text-theme-muted text-xs tracking-wider uppercase">
            {isSpinning
              ? "Losowanie..."
              : numUsers === 0
                ? "Brak osób do losowania"
                : "Zakręć kołem, żeby wylosować ofiarę"}
          </span>
        )}
      </div>

      <Button
        type="button"
        variant="default"
        onClick={handleSpin}
        disabled={isSpinning || numUsers === 0}
        className="w-full max-w-xs gap-2 font-bold tracking-wider uppercase shadow-lg"
      >
        <Dices size={18} />
        {isSpinning ? "Kręci się..." : "Zakręć"}
      </Button>

      {/* --- PANEL STEROWANIA UCZESTNIKAMI --- */}
      <div className="mt-2 flex w-full flex-col gap-3 border-t border-dashed border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-theme-muted text-[10px] font-bold tracking-wider uppercase">
            Biorą udział ({numUsers})
          </span>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSpinning || excludedUserIds.length === 0}
            className="text-theme-primary flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase transition hover:text-white disabled:opacity-30"
          >
            <RefreshCw size={12} />
            Resetuj
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {users.map((user) => {
            const isExcluded = excludedUserIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleToggleUser(user.id)}
                disabled={isSpinning}
                className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-bold uppercase transition-all ${
                  isExcluded
                    ? "bg-theme-bg text-theme-muted/40 border-white/5 line-through"
                    : "border-theme-primary/30 bg-theme-primary/10 text-theme-primary"
                }`}
              >
                {!isExcluded && <Check size={10} />}
                {user.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
