"use client";

import { useEffect, useState } from "react";
import { Coffee, Camera, GlassWater, CheckCircle2, Lock, UserPlus } from "lucide-react";
import { Link } from "~/components/ui/link";

const QUESTS = [
  {
    id: "q2",
    title: "Kuchenny Alchemik",
    description: "Przygotowanie królewskiego śniadania dla całej ekipy po ciężkiej nocy.",
    points: 3,
    icon: Coffee,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "q5",
    title: "Kronikarz",
    description: "Uchwycenie najlepszych momentów - zrób min. 50 zdjęć z dzisiejszego dnia.",
    points: 1,
    icon: Camera,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    id: "q6",
    title: "Eliksirowar",
    description: "Dbanie o to, by kubki nigdy nie były puste podczas wieczornego posiedzenia.",
    points: 1,
    icon: GlassWater,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
];

type QuestState = {
  status: "open" | "claimed" | "done";
  userName?: string;
};

export default function QuestsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeUserName, setActiveUserName] = useState<string | null>(null);
  const [questStates, setQuestStates] = useState<Record<string, QuestState>>({});

  useEffect(() => {
    const storedUserName = localStorage.getItem("tripkit_user_name");
    if (storedUserName) {
      setActiveUserName(storedUserName);
    }

    const savedStates = localStorage.getItem("tripkit_quests");
    if (savedStates) {
      try {
        setQuestStates(JSON.parse(savedStates) as Record<string, QuestState>);
      } catch (e) {
        console.error("Błąd wczytywania zleceń", e);
      }
    }
    setMounted(true);
  }, []);

  const saveState = (newState: Record<string, QuestState>) => {
    setQuestStates(newState);
    localStorage.setItem("tripkit_quests", JSON.stringify(newState));
  };

  const handleClaim = (questId: string) => {
    if (!activeUserName) return;
    saveState({
      ...questStates,
      [questId]: { status: "claimed", userName: activeUserName },
    });
  };

  const handleComplete = (questId: string) => {
    if (!activeUserName) return;
    saveState({
      ...questStates,
      [questId]: { ...questStates[questId], status: "done" },
    });
  };

  if (!mounted) return null;

  if (!activeUserName) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-theme-card text-theme-muted border-theme-border flex h-16 w-16 items-center justify-center rounded-full border shadow-sm">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="font-heading text-theme-text mb-2 text-3xl font-semibold">
            Tablica niedostępna
          </h2>
          <p className="font-body text-theme-muted mx-auto mb-6 max-w-64 text-sm">
            Musisz posiadać tożsamość, żeby przyjmować zlecenia.
          </p>
          <Link.Arrow href="/" variant="primary" size="base">
            Wróć do Bazy
          </Link.Arrow>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-theme-text text-5xl font-semibold">Zlecenia</h1>
          <p className="font-body text-theme-muted text-sm">Przyjmuj misje i zgarniaj punkty.</p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        {QUESTS.map((quest) => {
          const state = questStates[quest.id] ?? { status: "open" };
          const Icon = quest.icon;
          const isDone = state.status === "done";
          const isClaimedByMe = state.status === "claimed" && state.userName === activeUserName;
          const isClaimedByOther = state.status === "claimed" && state.userName !== activeUserName;

          return (
            <div
              key={quest.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300 ${
                isDone
                  ? "border-theme-success/25 bg-theme-success/5 opacity-60 grayscale-30"
                  : "bg-theme-card border-theme-border shadow-sm"
              }`}
            >
              {/* Nagłówek Zlecenia */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDone ? "bg-theme-success/20 text-theme-success" : `${quest.bg} ${quest.color}`}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-body text-theme-text text-lg font-bold">{quest.title}</h3>
                    <span className="text-theme-accent font-mono text-xs font-bold">
                      +{quest.points} PKT
                    </span>
                  </div>
                </div>
              </div>

              {/* Opis */}
              <p className="font-body text-theme-muted/90 text-sm">{quest.description}</p>

              {/* Akcje / Status */}
              <div className="border-theme-border mt-1 flex items-center justify-between border-t pt-3">
                {/* Informacja o statusie */}
                <div className="flex items-center gap-2">
                  {state.status === "open" && (
                    <span className="font-body text-theme-muted text-xs font-medium tracking-wider uppercase">
                      Oczekuje na śmiałka
                    </span>
                  )}
                  {state.status === "claimed" && (
                    <span className="font-body text-theme-primary flex items-center gap-1.5 text-xs font-bold">
                      <UserPlus size={14} /> W trakcie: {state.userName}
                    </span>
                  )}
                  {isDone && (
                    <span className="font-body text-theme-success flex items-center gap-1.5 text-xs font-bold">
                      <CheckCircle2 size={14} /> Wykonane przez: {state.userName}
                    </span>
                  )}
                </div>

                {/* Przycisk akcji */}
                {state.status === "open" && (
                  <button
                    onClick={() => handleClaim(quest.id)}
                    className="font-body bg-theme-text/10 text-theme-text hover:bg-theme-primary hover:text-theme-primary-foreground rounded-lg px-4 py-1.5 text-xs font-bold transition-colors active:scale-95"
                  >
                    Przyjmuję
                  </button>
                )}

                {isClaimedByMe && (
                  <button
                    onClick={() => handleComplete(quest.id)}
                    className="font-body bg-theme-success/20 text-theme-success hover:bg-theme-success hover:text-theme-bg flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors active:scale-95"
                  >
                    <CheckCircle2 size={14} /> Zrobione!
                  </button>
                )}

                {isClaimedByOther && (
                  <span className="font-body text-theme-muted text-xs font-medium">Zajęte</span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
