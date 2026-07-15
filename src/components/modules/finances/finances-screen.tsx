"use client";

import { useCallback, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { ExpenseForm } from "~/components/modules/finances/receipt-form";
import { calculateFinances, type FinanceExpense } from "~/lib/finances";
import { Skeleton } from "~/components/ui/skeleton";
import { Link } from "~/components/ui/link";
import { ExpenseReceipt } from "~/components/modules/finances/receipt";
import type { Database } from "~/types/database";
import { useTripRoute } from "~/providers/trip-route-provider";

// DODAŁEM: & { phone?: string | null }
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name"> & {
  phone?: string | null;
};

export function FinancesScreen({
  initialExpenses,
  initialUsers,
}: {
  initialExpenses: FinanceExpense[];
  initialUsers: User[];
}) {
  const { modules, tripId, urlKey, userId: activeUserId } = useTripRoute();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [expenses, setExpenses] = useState<FinanceExpense[]>(initialExpenses);

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFinanceEnabled = modules.finances;

  const loadData = useCallback(
    async (showInitialLoader = false) => {
      if (showInitialLoader) setIsInitialLoading(true);
      setHasError(false);

      try {
        const [usersRes, expensesRes] = await Promise.all([
          supabase
            .from("users")
            // DODAŁEM: pobieranie "phone"
            .select("id, name, phone")
            .eq("trip_id", tripId)
            .order("name"),
          supabase
            .from("expenses")
            .select("*")
            .eq("trip_id", tripId)
            .order("created_at", { ascending: false }),
        ]);

        if (usersRes.error || expensesRes.error) {
          console.error("Błąd wczytywania finansów:", usersRes.error ?? expensesRes.error);
          setHasError(true);
          return;
        }

        setUsers(usersRes.data ?? []);
        setExpenses(expensesRes.data ?? []);
      } catch (error) {
        console.error("Błąd wczytywania finansów:", error);
        setHasError(true);
      } finally {
        if (showInitialLoader) setIsInitialLoading(false);
      }
    },
    [tripId],
  );

  const refreshWithoutScrollJump = useCallback(async () => {
    const previousScrollPosition = window.scrollY;
    await loadData(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: previousScrollPosition, left: 0, behavior: "auto" });
      });
    });
  }, [loadData]);

  const { balances, transactions } = useMemo(
    () => calculateFinances(expenses, users),
    [expenses, users],
  );

  const debts = useMemo(
    () => transactions.filter((transaction) => transaction.from === activeUserId),
    [activeUserId, transactions],
  );

  const receivables = useMemo(
    () => transactions.filter((transaction) => transaction.to === activeUserId),
    [activeUserId, transactions],
  );

  const openExpenseModal = useCallback(() => setIsModalOpen(true), []);

  const handleExpenseSuccess = useCallback(() => {
    setIsModalOpen(false);
    void refreshWithoutScrollJump();
  }, [refreshWithoutScrollJump]);

  const handleDataChanged = useCallback(() => {
    void refreshWithoutScrollJump();
  }, [refreshWithoutScrollJump]);

  const activeUserBalance = activeUserId ? (balances[activeUserId] ?? 0) : 0;
  const showBlockingError = hasError && users.length === 0 && expenses.length === 0;

  return (
    <div className="animate-fade-in pb-safe pt-4">
      {!isFinanceEnabled || !activeUserId ? (
        <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="bg-theme-card text-theme-muted border-theme-border flex h-16 w-16 items-center justify-center rounded-full border shadow-sm">
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
            <Link.Arrow href={`/t/${urlKey}`} variant="primary" size="base">
              Wróć do Bazy
            </Link.Arrow>
          </div>
        </div>
      ) : isInitialLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-200 w-full rounded-2xl" />
        </div>
      ) : showBlockingError ? (
        <div className="border-theme-primary/20 bg-theme-card flex flex-col items-center gap-3 rounded-2xl border py-10 text-center">
          <span className="font-body text-theme-muted text-sm">Nie udało się wczytać danych.</span>
          <button
            type="button"
            onClick={() => void loadData(true)}
            className="bg-theme-primary/20 text-theme-primary font-body hover:bg-theme-primary hover:text-theme-primary-foreground rounded-lg px-4 py-2 text-xs font-bold transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <>
          {hasError && (
            <div className="border-theme-primary/20 bg-theme-primary/5 text-theme-muted mb-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs">
              <span>Nie udało się odświeżyć danych.</span>
              <button
                type="button"
                onClick={() => void loadData(false)}
                className="text-theme-primary font-bold"
              >
                Ponów
              </button>
            </div>
          )}

          <ExpenseReceipt
            expenses={expenses}
            users={users}
            activeUserId={activeUserId}
            balance={activeUserBalance}
            debts={debts}
            receivables={receivables}
            onDataChanged={handleDataChanged}
            onAddExpense={openExpenseModal}
          />
        </>
      )}

      <ResponsiveDialog isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <ExpenseForm
          users={users}
          activeUserId={activeUserId ?? ""}
          onSuccess={handleExpenseSuccess}
        />
      </ResponsiveDialog>
    </div>
  );
}
