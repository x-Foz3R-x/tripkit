"use client";

import { memo, useMemo, useState } from "react";
import { Check, Dices, History, RefreshCw, UsersRound } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Database } from "~/types/database";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "team_id"> & {
  color_hex?: string | null;
};

interface WheelOfFortuneProps {
  users: User[];
}

const FALLBACK_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#eab308",
  "#06b6d4",
  "#d946ef",
  "#f43f5e",
];

const SPIN_DURATION = 4400;

export const WheelOfFortune = memo(function WheelOfFortune({ users }: WheelOfFortuneProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<User | null>(null);
  const [history, setHistory] = useState<User[]>([]);
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);
  const [excludeWinner, setExcludeWinner] = useState(true);

  const activeUsers = useMemo(
    () => users.filter((user) => !excludedUserIds.includes(user.id)),
    [users, excludedUserIds],
  );
  const numUsers = activeUsers.length;
  const sliceAngle = numUsers > 0 ? 360 / numUsers : 0;

  const handleToggleUser = (userId: string) => {
    if (isSpinning) return;
    setWinner(null);
    setExcludedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

  const handleReset = () => {
    if (isSpinning) return;
    setExcludedUserIds([]);
    setWinner(null);
    setHistory([]);
    setRotation(0);
  };

  const selectNobody = () => {
    if (isSpinning) return;
    setWinner(null);
    setExcludedUserIds(users.map((user) => user.id));
  };

  const handleSpin = () => {
    if (isSpinning || numUsers === 0) return;

    const winningIndex = randomInteger(numUsers);
    const selectedWinner = activeUsers[winningIndex];
    if (!selectedWinner) return;

    setIsSpinning(true);
    setWinner(null);

    const winnerCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const alignment = (360 - winnerCenterAngle - normalizedRotation + 360) % 360;
    const turns = 5 + randomInteger(4);
    const totalRotation = rotation + turns * 360 + alignment;
    setRotation(totalRotation);

    window.setTimeout(() => {
      setWinner(selectedWinner);
      setHistory((current) => [selectedWinner, ...current].slice(0, 5));
      if (excludeWinner) {
        setExcludedUserIds((current) =>
          current.includes(selectedWinner.id) ? current : [...current, selectedWinner.id],
        );
      }
      if ("vibrate" in navigator) navigator.vibrate(35);
      setIsSpinning(false);
    }, SPIN_DURATION);
  };

  const gradientStops = activeUsers
    .map((user, index) => {
      const color = user.color_hex ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
      const startAngle = index * sliceAngle;
      const endAngle = (index + 1) * sliceAngle + 0.6;
      return `${color} ${startAngle}deg ${endAngle}deg`;
    })
    .join(", ");
  const wheelBackground = numUsers > 0 ? `conic-gradient(${gradientStops})` : "#2b241c";

  if (users.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="bg-theme-card/55 border-theme-border flex flex-col items-center overflow-hidden rounded-3xl border px-3 py-5 shadow-xs">
        <div className="relative flex items-center justify-center pt-2">
          <div className="bg-theme-text absolute -top-1 z-20 size-5 rotate-45 rounded-sm shadow-lg" />
          <div
            className="border-theme-card relative size-72 overflow-hidden rounded-full border-5 shadow-2xl sm:size-80"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: wheelBackground,
              transitionProperty: "transform",
              transitionDuration: `${SPIN_DURATION}ms`,
              transitionTimingFunction: "cubic-bezier(0.12, 0.78, 0.18, 1)",
            }}
          >
            {activeUsers.map((user, index) => {
              const labelRotation = index * sliceAngle + sliceAngle / 2;
              return (
                <div
                  key={user.id}
                  className="absolute top-1/2 left-1/2 flex h-8 w-34 origin-left -translate-y-1/2 items-center justify-end pr-3"
                  style={{ transform: `rotate(${labelRotation - 90}deg)` }}
                >
                  <span className="max-w-24 truncate text-[10px] font-black tracking-wide text-white uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    {user.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex min-h-16 flex-col items-center justify-center text-center">
          {winner ? (
            <div className="animate-fade-in">
              <span className="text-theme-muted block text-[10px] font-bold tracking-[0.16em] uppercase">
                Wylosowano
              </span>
              <strong className="font-heading text-theme-primary mt-0.5 block text-3xl font-bold">
                {winner.name}
              </strong>
            </div>
          ) : (
            <span className="text-theme-muted text-[10px] font-bold tracking-[0.16em] uppercase">
              {isSpinning
                ? "Koło wybiera…"
                : numUsers === 0
                  ? "Wybierz przynajmniej jedną osobę"
                  : `${numUsers} ${numUsers === 1 ? "osoba w puli" : "osób w puli"}`}
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning || numUsers === 0}
          className="mt-1 w-full max-w-80 gap-2 font-bold tracking-wider uppercase"
        >
          <Dices size={18} />
          {isSpinning ? "Kręci się…" : "Zakręć"}
        </Button>
      </div>

      <section className="bg-theme-card/35 border-theme-border rounded-3xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-theme-text flex items-center gap-2 text-sm font-bold">
              <UsersRound className="text-theme-primary" size={17} /> Kto bierze udział
            </p>
            <p className="text-theme-muted mt-1 text-[10px]">
              Wszystkie osoby są widoczne — dotknij, aby wykluczyć.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSpinning}
            className="text-theme-primary flex min-h-10 items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-30"
          >
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {users.map((user) => {
            const isExcluded = excludedUserIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleToggleUser(user.id)}
                disabled={isSpinning}
                aria-pressed={!isExcluded}
                className={`flex min-h-12 min-w-0 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold transition active:scale-98 ${
                  isExcluded
                    ? "bg-theme-bg/35 text-theme-muted/55 border-theme-border line-through"
                    : "border-theme-primary/35 bg-theme-primary/9 text-theme-text"
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    isExcluded
                      ? "border-theme-muted/35"
                      : "border-theme-primary bg-theme-primary text-theme-primary-foreground"
                  }`}
                >
                  {!isExcluded && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="truncate">{user.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setExcludedUserIds([])}
            disabled={isSpinning || excludedUserIds.length === 0}
            className="text-theme-primary min-h-10 text-[10px] font-bold uppercase disabled:opacity-30"
          >
            Zaznacz wszystkich
          </button>
          <button
            type="button"
            onClick={selectNobody}
            disabled={isSpinning || numUsers === 0}
            className="text-theme-muted min-h-10 text-[10px] font-bold uppercase disabled:opacity-30"
          >
            Wyczyść
          </button>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={excludeWinner}
          onClick={() => setExcludeWinner((value) => !value)}
          disabled={isSpinning}
          className="border-theme-border mt-2 flex min-h-14 w-full items-center justify-between gap-4 border-t pt-3 text-left"
        >
          <span>
            <span className="text-theme-text block text-xs font-bold">
              Nie losuj zwycięzcy ponownie
            </span>
            <span className="text-theme-muted mt-0.5 block text-[10px]">
              Po wyniku osoba automatycznie wypada z puli.
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              excludeWinner ? "bg-theme-primary" : "bg-theme-muted/25"
            }`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-white transition ${
                excludeWinner ? "left-6" : "left-1"
              }`}
            />
          </span>
        </button>
      </section>

      {history.length > 0 && (
        <section className="border-theme-border flex items-start gap-3 border-t px-1 pt-4">
          <History className="text-theme-muted mt-0.5 shrink-0" size={16} />
          <div className="min-w-0">
            <p className="text-theme-muted text-[9px] font-bold tracking-wider uppercase">
              Ostatnie losowania
            </p>
            <p className="text-theme-text mt-1 truncate text-xs font-bold">
              {history.map((user) => user.name).join(" · ")}
            </p>
          </div>
        </section>
      )}
    </section>
  );
});

function randomInteger(max: number) {
  if (max <= 1) return 0;
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return (values[0] ?? 0) % max;
  }
  return Math.floor(Math.random() * max);
}
