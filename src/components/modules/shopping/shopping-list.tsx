"use client";

import { memo, useState } from "react";
import { CheckCircle2, Circle, Trash2, UserRound } from "lucide-react";
import type { Database } from "~/types/database";
import { supabase } from "~/lib/supabase";

type ShoppingItem = Database["public"]["Tables"]["shopping_list"]["Row"];
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

interface ShoppingListProps {
  items: ShoppingItem[];
  users: User[];
  onDataChanged: () => void;
}

export const ShoppingList = memo(function ShoppingList({
  items,
  users,
  onDataChanged,
}: ShoppingListProps) {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeItems = items.filter((item) => !item.is_completed);
  const archivedItems = items.filter((item) => item.is_completed);

  const displayedItems = activeTab === "active" ? activeItems : archivedItems;

  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name ?? "Nieznany";

  const handleToggle = async (item: ShoppingItem) => {
    if (loadingId) return;
    setLoadingId(item.id);

    const { error } = await supabase
      .from("shopping_list")
      .update({ is_completed: !item.is_completed })
      .eq("id", item.id);

    setLoadingId(null);
    if (!error) onDataChanged();
  };

  const handleDelete = async (id: string) => {
    if (loadingId) return;
    setLoadingId(id);

    const { error } = await supabase.from("shopping_list").delete().eq("id", id);

    setLoadingId(null);
    if (!error) onDataChanged();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Zakładki */}
      <div className="bg-theme-text/5 flex w-full rounded-xl p-1">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex-1 rounded-lg py-2 text-[11px] font-bold tracking-wider uppercase transition-all ${
            activeTab === "active" ? "bg-theme-card text-theme-text shadow-sm" : "text-theme-muted"
          }`}
        >
          Do kupienia ({activeItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archived")}
          className={`flex-1 rounded-lg py-2 text-[11px] font-bold tracking-wider uppercase transition-all ${
            activeTab === "archived"
              ? "bg-theme-card text-theme-text shadow-sm"
              : "text-theme-muted"
          }`}
        >
          Kupione ({archivedItems.length})
        </button>
      </div>

      {/* Lista Elementów */}
      <div className="flex flex-col gap-2">
        {displayedItems.length === 0 ? (
          <div className="border-theme-border flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-center">
            <span className="text-theme-muted text-sm">
              {activeTab === "active"
                ? "Brak rzeczy do kupienia. Jesteście zaopatrzeni!"
                : "Archiwum jest puste."}
            </span>
          </div>
        ) : (
          displayedItems.map((item) => {
            const addedBy = getUserName(item.added_by);
            const isForSpecific = item.for_users && item.for_users.length > 0;
            const forNames = isForSpecific ? item.for_users.map(getUserName).join(", ") : "Wspólne";

            const isLoading = loadingId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-theme-card border-theme-border flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                  item.is_completed ? "opacity-60" : ""
                } ${isLoading ? "animate-pulse opacity-50" : ""}`}
              >
                <div
                  className="flex flex-1 cursor-pointer items-start gap-3"
                  onClick={() => void handleToggle(item)}
                >
                  <button type="button" className="mt-0.5 shrink-0 transition-colors">
                    {item.is_completed ? (
                      <CheckCircle2 size={22} className="text-theme-primary" />
                    ) : (
                      <Circle size={22} className="text-theme-muted" />
                    )}
                  </button>

                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-theme-text text-sm font-semibold transition-all ${
                        item.is_completed ? "text-theme-text/60 line-through" : ""
                      }`}
                    >
                      {item.item_name}
                    </span>

                    <div className="text-theme-muted flex items-center gap-2 text-[10px] tracking-wider uppercase">
                      <span>Dodał: {addedBy}</span>
                      {isForSpecific && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="text-theme-primary/80 flex items-center gap-1">
                            <UserRound size={10} />
                            Dla: {forNames}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Usuwanie możliwe tylko z Archiwum */}
                {item.is_completed && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    className="text-theme-muted hover:text-theme-danger p-2 transition-colors"
                    disabled={isLoading}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
