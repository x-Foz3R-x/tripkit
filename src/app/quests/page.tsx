"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  Coffee,
  Droplets,
  Music,
  Camera,
  GlassWater,
  CheckCircle2,
  Lock,
  UserPlus,
} from "lucide-react";
import { Link } from "~/components/ui/link";

// Nasza lista zleceń
const QUESTS = [
  {
    id: "q1",
    title: "Mistrz Ognia",
    description: "Rozpalenie i utrzymanie ogniska, żeby nie zgasło przez cały wieczór.",
    points: 5,
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "q2",
    title: "Kuchenny Alchemik",
    description: "Przygotowanie królewskiego śniadania dla całej ekipy po ciężkiej nocy.",
    points: 10,
    icon: Coffee,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "q3",
    title: "Zaklinacz Wody",
    description: "Umycie wszystkich naczyń i garnków po wielkim, wspólnym obiedzie.",
    points: 10,
    icon: Droplets,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    id: "q4",
    title: "Główny Bard",
    description: "Ogarnięcie muzyki na imprezę i pilnowanie, żeby nikt nie psuł kolejki.",
    points: 5,
    icon: Music,
    color: "text-theme-primary",
    bg: "bg-theme-primary/10",
  },
  {
    id: "q5",
    title: "Kronikarz",
    description: "Uchwycenie najlepszych momentów – zrób min. 50 zdjęć z dzisiejszego dnia.",
    points: 10,
    icon: Camera,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    id: "q6",
    title: "Eliksirowar",
    description: "Dbanie o to, by kubki nigdy nie były puste podczas wieczornego posiedzenia.",
    points: 5,
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
        <div className="bg-theme-card text-theme-muted flex h-16 w-16 items-center justify-center rounded-full border border-white/5 shadow-sm">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="font-heading text-theme-text mb-2 text-3xl font-semibold">
            Tablica zamknięta
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
          <h1 className="font-heading text-theme-text text-5xl font-semibold tracking-wide drop-shadow-sm">
            Zlecenia
          </h1>
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
                  ? "border-emerald-500/20 bg-emerald-500/5 opacity-60 grayscale-30"
                  : "bg-theme-card border-white/5 shadow-sm"
              }`}
            >
              {/* Nagłówek Zlecenia */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDone ? "bg-emerald-500/20 text-emerald-500" : `${quest.bg} ${quest.color}`}`}
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
              <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-3">
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
                    <span className="font-body flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 size={14} /> Wykonane przez: {state.userName}
                    </span>
                  )}
                </div>

                {/* Przycisk akcji */}
                {state.status === "open" && (
                  <button
                    onClick={() => handleClaim(quest.id)}
                    className="font-body hover:bg-theme-primary rounded-lg bg-white/10 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:text-white active:scale-95"
                  >
                    Przyjmuję
                  </button>
                )}

                {isClaimedByMe && (
                  <button
                    onClick={() => handleComplete(quest.id)}
                    className="font-body flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500 hover:text-white active:scale-95"
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
