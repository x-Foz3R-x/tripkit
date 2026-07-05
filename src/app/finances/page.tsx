"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import { ResponsiveModal } from "~/components/responsive-modal";
import { ExpenseForm } from "~/components/modules/finances/expense-form";
import { calculateFinances } from "~/lib/finances";
import { Skeleton } from "~/components/ui/skeleton";
import { Link } from "~/components/ui/link";
import { ExpenseReceipt } from "~/components/modules/finances/expense-receipt";
import type { Database } from "~/types/database";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

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
      supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", env.NEXT_PUBLIC_TRIP_ID)
        .order("created_at", { ascending: true }),
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

  const isFinanceEnabled = env.NEXT_PUBLIC_FINANCE_ENABLED === "true";

  useEffect(() => {
    const storedUserId = localStorage.getItem("tripkit_user_id");

    if (storedUserId) {
      setActiveUserId(storedUserId);
      void fetchData();
    }

    setMounted(true);
  }, []);

  const { balances, transactions } = useMemo(
    () => calculateFinances(expenses, users),
    [expenses, users],
  );

  if (!mounted) return null;

  if (!isFinanceEnabled || !activeUserId) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-theme-card text-theme-muted flex h-16 w-16 items-center justify-center rounded-full border border-white/5 shadow-sm">
          <Lock size={28} />
        </div>

        <div>
          <h2 className="font-heading text-theme-text mb-2 text-3xl font-semibold">
            Skarbiec zamknięty
          </h2>

          <p className="font-body text-theme-muted mx-auto mb-6 max-w-64 text-sm">
            {!isFinanceEnabled
              ? "Skarbiec jest chwilowo zamknięty. Wspólne rozliczenia pojawią się, gdy zacznie się wyjazd."
              : "Musisz najpierw powiedzieć nam, kim jesteś w Księdze Wyjazdu."}
          </p>

          <Link.Arrow href="/" variant="primary" size="base">
            Wróć do Bazy
          </Link.Arrow>
        </div>
      </div>
    );
  }

  const activeUserBalance = balances[activeUserId] ?? 0;

  return (
    <div className="animate-fade-in pb-4">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-100 w-full rounded-2xl" />
        </div>
      ) : hasError ? (
        <div className="border-theme-primary/20 bg-theme-card flex flex-col items-center gap-3 rounded-2xl border py-10 text-center">
          <span className="font-body text-theme-muted text-sm">Nie udało się wczytać danych.</span>

          <button
            onClick={() => void fetchData()}
            className="bg-theme-primary/20 text-theme-primary font-body hover:bg-theme-primary rounded-lg px-4 py-2 text-xs font-bold transition-colors hover:text-white"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <ExpenseReceipt
          expenses={expenses}
          users={users}
          activeUserId={activeUserId}
          balance={activeUserBalance}
          debts={transactions.filter((transaction) => transaction.from === activeUserId)}
          receivables={transactions.filter((transaction) => transaction.to === activeUserId)}
          onSettled={() => void fetchData()}
          onAddExpense={() => setIsModalOpen(true)}
        />
      )}

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
