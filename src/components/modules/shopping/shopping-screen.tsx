"use client";

import { useCallback, useState } from "react";
import { Lock, Plus, ShoppingBasket } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { Link } from "~/components/ui/link";
import { ShoppingForm } from "~/components/modules/shopping/shopping-form";
import { ShoppingList } from "~/components/modules/shopping/shopping-list";
import type { Database } from "~/types/database";
import { useTripRoute } from "~/providers/trip-route-provider";

type ShoppingItem = Database["public"]["Tables"]["shopping_list"]["Row"];
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

export function ShoppingScreen({
  initialItems,
  initialUsers,
}: {
  initialItems: ShoppingItem[];
  initialUsers: User[];
}) {
  const { modules, tripId, urlKey, userId: activeUserId } = useTripRoute();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFinanceEnabled = modules.shopping;

  const loadData = useCallback(async () => {
    try {
      const [usersRes, listRes] = await Promise.all([
        supabase.from("users").select("id, name").eq("trip_id", tripId).order("name"),
        supabase
          .from("shopping_list")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at", { ascending: false }),
      ]);

      setUsers(usersRes.data ?? []);
      setItems(listRes.data ?? []);
    } catch (error) {
      console.error("Błąd ładowania listy zakupów:", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [tripId]);

  if (!isFinanceEnabled || !activeUserId) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-theme-card text-theme-muted border-theme-border flex h-16 w-16 items-center justify-center rounded-full border shadow-sm">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="font-heading text-theme-text mb-2 text-3xl font-semibold">
            Lista niedostępna
          </h2>
          <p className="font-body text-theme-muted mx-auto mb-6 max-w-64 text-sm">
            Musisz najpierw powiedzieć nam, kim jesteś w Księdze Wyjazdu.
          </p>
          <Link.Arrow href={`/t/${urlKey}`} variant="primary" size="base">
            Wróć do Bazy
          </Link.Arrow>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6 pt-4">
      <header className="flex items-center justify-between pt-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="text-theme-primary" size={24} />
            <h1 className="font-heading text-theme-text text-4xl font-semibold">Zakupy</h1>
          </div>
          <p className="text-theme-muted text-sm">Wspólna check-lista wyjazdowa.</p>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-theme-primary text-theme-primary-foreground shadow-theme-primary/20 hover:bg-theme-primary-hover active:bg-theme-primary-active flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold tracking-wider uppercase shadow-lg transition active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.5} />
        Dodaj produkt
      </button>

      {isInitialLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : (
        <ShoppingList items={items} users={users} onDataChanged={loadData} />
      )}

      <ResponsiveDialog isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <ShoppingForm
          users={users}
          activeUserId={activeUserId}
          onSuccess={() => {
            setIsModalOpen(false);
            void loadData();
          }}
        />
      </ResponsiveDialog>
    </div>
  );
}
