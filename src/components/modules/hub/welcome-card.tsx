// src/components/modules/hub/welcome-card.tsx
"use client";

import { useEffect, useState } from "react";
import { LogOut, Check } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import { Skeleton } from "~/components/ui/skeleton";
import type { Database } from "~/types/database";
import { Avatar } from "~/components/ui/avatar";

// Bierzemy DOKŁADNIE typy kolumn 'id' i 'name' z tabeli 'users' z naszej bazy
type Participant = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

export function WelcomeCard() {
  const [mounted, setMounted] = useState(false);
  const [activeUser, setActiveUser] = useState<Participant | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem("tripkit_user_id");
    const storedUserName = localStorage.getItem("tripkit_user_name");

    if (storedUserId && storedUserName) {
      setActiveUser({ id: storedUserId, name: storedUserName });
    }
    setMounted(true);

    async function fetchParticipants() {
      // TypeScript dzięki Supabase Clientowi wie już, że tabela "users" istnieje
      const { data, error } = await supabase
        .from("users")
        .select("id, name")
        .eq("trip_id", env.NEXT_PUBLIC_TRIP_ID)
        .order("name");

      if (error) {
        console.error("Błąd pobierania uczestników:", error);
      } else if (data) {
        setParticipants(data);
      }
      setIsLoading(false);
    }

    // ROZWIĄZANIE BŁĘDU (void jawnie ignoruje niezłapanego promise'a w świetle lintera)
    void fetchParticipants();
  }, []);

  const handleSelectUser = (user: Participant) => {
    localStorage.setItem("tripkit_user_id", user.id);
    localStorage.setItem("tripkit_user_name", user.name);
    setActiveUser(user);
  };

  const handleResetUser = () => {
    localStorage.removeItem("tripkit_user_id");
    localStorage.removeItem("tripkit_user_name");
    setActiveUser(null);
  };

  if (!mounted) return null;

  if (activeUser) {
    return (
      <div className="bg-theme-card flex items-center justify-between rounded-2xl border border-white/5 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-theme-primary flex h-12 w-12 items-center justify-center rounded-full">
            <Avatar user={activeUser} />
          </div>
          <div>
            <p className="font-body text-theme-muted text-sm">Gotowy na wyjazd?</p>
            <p className="font-body text-theme-text text-lg font-semibold">
              Cześć, {activeUser.name}!
            </p>
          </div>
        </div>
        <button
          onClick={handleResetUser}
          className="font-body text-theme-muted flex flex-col items-center gap-1 text-xs transition-colors hover:text-white"
        >
          <LogOut size={16} />
          <span>Zmień</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-theme-card flex flex-col gap-5 rounded-2xl border border-white/5 p-6 shadow-sm">
      <div>
        <h2 className="font-body text-theme-text text-lg font-semibold">Kim jesteś?</h2>
        <p className="font-body text-theme-muted text-sm">
          Wybierz swój profil, by zsynchronizować finanse.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={`skel-${i}`} className="flex flex-col items-center gap-2 p-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            ))
          : participants.map((user) => {
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="group bg-theme-bg/50 hover:border-theme-primary/50 focus:ring-theme-primary/50 relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-white/5 p-2 transition-all hover:bg-white/5 focus:ring-2 focus:outline-none active:scale-95"
                >
                  <Avatar user={user} />
                  <span className="font-body text-theme-text text-xs font-medium">{user.name}</span>

                  <div className="text-theme-primary absolute top-2 right-2 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                    <Check size={14} />
                  </div>
                </button>
              );
            })}
      </div>
    </div>
  );
}
