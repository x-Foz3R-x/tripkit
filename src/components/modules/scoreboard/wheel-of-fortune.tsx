"use client";

import { memo, useMemo, useState } from "react";
import { Check, Dices, RefreshCw } from "lucide-react";
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

  const gradientStops = activeUsers
    .map((user, i) => {
      let bgColor = user.color_hex;

      if (!bgColor) {
        let colorIndex = i;
        if (numUsers % 2 !== 0 && i === numUsers - 1 && numUsers > 1) {
          colorIndex = i + 1;
        }
        bgColor = FALLBACK_COLORS[colorIndex % FALLBACK_COLORS.length];
      }

      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle + 1;

      return `${bgColor} ${startAngle}deg ${endAngle}deg`;
    })
    .join(", ");

  const wheelBackground = numUsers > 0 ? `conic-gradient(${gradientStops})` : "#1e1e24";

  if (users.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-theme-accent text-[10px] font-bold tracking-[0.18em] uppercase">
            Losowanie
          </p>
          <h2 className="font-heading text-theme-text text-2xl font-semibold">Koło fortuny</h2>
        </div>
        <span className="text-theme-muted text-[10px]">{numUsers} osób w puli</span>
      </div>

      <div className="bg-theme-card/45 border-theme-border flex flex-col items-center rounded-3xl border px-4 py-5 shadow-xs">
        <div className="relative flex items-center justify-center">
          <div className="bg-theme-text absolute -top-2 z-10 size-4 rotate-45 rounded-xs shadow-md" />
          <div
            className="border-theme-card relative size-56 overflow-hidden rounded-full border-4 shadow-xl transition-transform duration-4000 ease-[cubic-bezier(0.15,0.85,0.35,1)]"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: wheelBackground,
            }}
          >
            {activeUsers.map((user, i) => {
              const labelRotation = i * sliceAngle + sliceAngle / 2;
              return (
                <div
                  key={user.id}
                  className="absolute top-1/2 left-1/2 flex h-7 w-25 origin-left -translate-y-1/2 items-center justify-end pr-2.5"
                  style={{ transform: `rotate(${labelRotation - 90}deg)` }}
                >
                  <span className="truncate text-[9px] font-black tracking-wider text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {user.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex min-h-12 flex-col items-center justify-center">
          {winner ? (
            <div className="animate-fade-in flex flex-col items-center text-center">
              <span className="text-theme-muted text-[10px] font-bold tracking-wider uppercase">
                Wylosowano
              </span>
              <span className="text-theme-primary font-heading text-2xl font-bold">
                {winner.name}
              </span>
            </div>
          ) : (
            <span className="text-theme-muted text-center text-[10px] font-bold tracking-wider uppercase">
              {isSpinning
                ? "Losowanie..."
                : numUsers === 0
                  ? "Brak osób do losowania"
                  : "Koło czeka na obrót"}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="default"
          onClick={handleSpin}
          disabled={isSpinning || numUsers === 0}
          className="mt-2 w-full max-w-72 gap-2 font-bold tracking-wider uppercase"
        >
          <Dices size={18} />
          {isSpinning ? "Kręci się..." : "Zakręć"}
        </Button>

        <div className="border-theme-border mt-5 flex w-full flex-col gap-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-theme-muted text-[10px] font-bold tracking-wider uppercase">
              Kto bierze udział
            </span>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSpinning || excludedUserIds.length === 0}
              className="text-theme-primary hover:text-theme-text flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase transition disabled:opacity-30"
            >
              <RefreshCw size={12} />
              Resetuj
            </button>
          </div>

          <div className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1">
            {users.map((user) => {
              const isExcluded = excludedUserIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleToggleUser(user.id)}
                  disabled={isSpinning}
                  className={`flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-[10px] font-bold transition-all ${
                    isExcluded
                      ? "bg-theme-bg text-theme-muted/50 border-theme-border line-through"
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
    </section>
  );
});
