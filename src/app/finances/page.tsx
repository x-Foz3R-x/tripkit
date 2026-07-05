// src/app/finances/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Lock } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import { ResponsiveModal } from "~/components/responsive-modal";
import { ExpenseForm } from "~/components/modules/finances/expense-form";
import { calculateFinances } from "~/lib/finances";
import { Skeleton } from "~/components/ui/skeleton";
import { Link } from "~/components/ui/link";
import { UserFinanceCard } from "~/components/modules/finances/user-finance-card";
import type { Database } from "~/types/database";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

export default function FinancesPage() {
  const [mounted, setMounted] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const [usersRes, expensesRes] = await Promise.all([
      supabase
        .from("users")
        .select("id, name")
        .eq("trip_id", env.NEXT_PUBLIC_TRIP_ID)
        .order("name"),
      supabase.from("expenses").select("*").eq("trip_id", env.NEXT_PUBLIC_TRIP_ID),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (expensesRes.data) setExpenses(expensesRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("tripkit_user_id");
    if (storedUserId) setActiveUserId(storedUserId);
    setMounted(true);
    if (storedUserId) void fetchData();
  }, []);

  const { balances, transactions } = useMemo(
    () => calculateFinances(expenses, users),
    [expenses, users],
  );

  if (!mounted) return null;

  if (!activeUserId) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-theme-card text-theme-muted flex h-16 w-16 items-center justify-center rounded-full border border-white/5 shadow-sm">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="font-heading text-theme-text mb-2 text-3xl font-semibold">
            Kociołek zamknięty
          </h2>
          <p className="font-body text-theme-muted mx-auto mb-6 max-w-64 text-sm">
            Musisz powiedzieć nam kim jesteś w Księdze Wyjazdu.
          </p>
          <Link.Arrow href="/" variant="primary" size="base">
            Wróć do Bazy
          </Link.Arrow>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header className="flex items-center justify-between pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-theme-text text-5xl font-semibold tracking-wide drop-shadow-sm">
            Kociołek
          </h1>
          <p className="font-body text-theme-muted text-sm">Każdy pod kontrolą.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-theme-primary flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus strokeWidth={2.5} size={24} />
        </button>
      </header>

      <section className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : (
          users.map((user) => (
            <UserFinanceCard
              key={user.id}
              user={user}
              balance={balances[user.id] ?? 0}
              debts={transactions.filter((t) => t.from === user.id)}
              receivables={transactions.filter((t) => t.to === user.id)} // Kto MI wisi kasę?
              allUsers={users}
              onSettled={() => void fetchData()}
            />
          ))
        )}
      </section>

      <ResponsiveModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} title="Nowy wydatek">
        <ExpenseForm
          users={users}
          activeUserId={activeUserId}
          onSuccess={() => {
            setIsModalOpen(false);
            void fetchData();
          }}
        />
      </ResponsiveModal>
    </div>
  );
}
