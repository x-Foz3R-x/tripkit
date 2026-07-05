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

function FinanceCardSkeleton() {
  return (
    <div className="bg-theme-card flex flex-col overflow-hidden rounded-2xl border border-white/10">
      <div className="flex items-center justify-between bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </div>
    </div>
  );
}

export default function FinancesPage() {
  const [mounted, setMounted] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);

    const [usersRes, expensesRes] = await Promise.all([
      supabase
        .from("users")
        .select("id, name")
        .eq("trip_id", env.NEXT_PUBLIC_TRIP_ID)
        .order("name"),
      supabase.from("expenses").select("*").eq("trip_id", env.NEXT_PUBLIC_TRIP_ID),
    ]);

    if (usersRes.error || expensesRes.error) {
      console.error("Błąd wczytywania finansów:", usersRes.error ?? expensesRes.error);
      setHasError(true);
    } else {
      if (usersRes.data) setUsers(usersRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
    }

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
          aria-label="Dodaj nowy wydatek"
          className="bg-theme-primary focus-visible:ring-theme-primary focus-visible:ring-offset-theme-bg flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
        >
          <Plus strokeWidth={2.5} size={24} />
        </button>
      </header>

      <section className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <FinanceCardSkeleton />
            <FinanceCardSkeleton />
            <FinanceCardSkeleton />
          </div>
        ) : hasError ? (
          <div className="border-theme-primary/20 bg-theme-card flex flex-col items-center gap-3 rounded-2xl border py-10 text-center">
            <span className="font-body text-theme-muted text-sm">
              Nie udało się wczytać danych.
            </span>
            <button
              onClick={() => void fetchData()}
              className="bg-theme-primary/20 text-theme-primary font-body hover:bg-theme-primary rounded-lg px-4 py-2 text-xs font-bold transition-colors hover:text-white"
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
            <span className="font-body text-theme-muted text-sm">Nikogo tu jeszcze nie ma.</span>
          </div>
        ) : (
          users.map((user, index) => (
            <div
              key={user.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
            >
              <UserFinanceCard
                user={user}
                balance={balances[user.id] ?? 0}
                debts={transactions.filter((t) => t.from === user.id)}
                receivables={transactions.filter((t) => t.to === user.id)}
                allUsers={users}
                activeUserId={activeUserId}
                onSettled={() => void fetchData()}
              />
            </div>
          ))
        )}
      </section>

      <ResponsiveModal isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
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
