"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { ExpenseForm } from "~/components/modules/finances/receipt-form";
import { calculateFinances, type FinanceExpense } from "~/lib/finances";
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
  const router = useRouter();
  const { modules, urlKey, userId: activeUserId, financeMode, settlementStrategy } = useTripRoute();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFinanceEnabled = modules.finances;

  const { balances, transactions, relationalTransactions, optimizedTransactions } = useMemo(
    () => calculateFinances(initialExpenses, initialUsers, financeMode, settlementStrategy),
    [financeMode, initialExpenses, initialUsers, settlementStrategy],
  );

  const debts = useMemo(
    () => transactions.filter((transaction) => transaction.from === activeUserId),
    [activeUserId, transactions],
  );

  const receivables = useMemo(
    () => transactions.filter((transaction) => transaction.to === activeUserId),
    [activeUserId, transactions],
  );

  const handleExpenseSuccess = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  const activeUserBalance = activeUserId ? (balances[activeUserId] ?? 0) : 0;
  return (
    <div className="animate-fade-in pb-safe pt-4">
      {!isFinanceEnabled || !activeUserId ? (
        <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="bg-theme-card text-theme-muted border-theme-border flex h-16 w-16 items-center justify-center rounded-full border shadow-xs">
            <Lock size={28} />
          </div>
          <div>
            <h2 className="font-heading text-theme-text mb-2 text-3xl font-semibold">
              Rozliczenia wyłączone
            </h2>
            <p className="font-body text-theme-muted mx-auto mb-6 max-w-64 text-sm">
              {!isFinanceEnabled
                ? "Rozliczenia są wyłączone dla tego wyjazdu."
                : "Musisz najpierw powiedzieć nam, kim jesteś w Księdze Wyjazdu."}
            </p>
            <Link.Arrow href={`/t/${urlKey}`} variant="primary" size="base">
              Wróć do Bazy
            </Link.Arrow>
          </div>
        </div>
      ) : (
        <ExpenseReceipt
          expenses={initialExpenses}
          users={initialUsers}
          activeUserId={activeUserId}
          balance={activeUserBalance}
          debts={debts}
          receivables={receivables}
          financeMode={financeMode}
          settlementStrategy={settlementStrategy}
          relationalTransactions={relationalTransactions}
          optimizedTransactions={optimizedTransactions}
          onDataChanged={router.refresh}
          onAddExpense={() => setIsModalOpen(true)}
        />
      )}

      <ResponsiveDialog isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
        <ExpenseForm
          users={initialUsers}
          activeUserId={activeUserId ?? ""}
          onSuccess={handleExpenseSuccess}
        />
      </ResponsiveDialog>
    </div>
  );
}
