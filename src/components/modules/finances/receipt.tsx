"use client";

import { memo, useMemo } from "react";
import type { Database } from "~/types/database";
import { isSettlementEntry, type FinanceExpense, type Transaction } from "~/lib/finances";
import { ReceiptHeader } from "~/components/modules/finances/receipt-header";
import { ReceiptExpenseList } from "~/components/modules/finances/receipt-expense-list";
import { ReceiptSummary } from "~/components/modules/finances/receipt-summary";
import { ReceiptPaymentSection } from "~/components/modules/finances/receipt-payment-section";
import { ReceiptFooter } from "~/components/modules/finances/receipt-footer";
import { useTripRoute } from "~/providers/trip-route-provider";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name"> & {
  phone?: string | null;
};

interface ExpenseReceiptProps {
  expenses: FinanceExpense[];
  users: User[];
  activeUserId: string;
  balance: number;
  debts: Transaction[];
  receivables: Transaction[];
  onDataChanged: () => void;
  onAddExpense: () => void;
}

export const ExpenseReceipt = memo(function ExpenseReceipt({
  expenses,
  users,
  activeUserId,
  balance,
  debts,
  receivables,
  onDataChanged,
  onAddExpense,
}: ExpenseReceiptProps) {
  const { tripId } = useTripRoute();
  const regularExpenses = useMemo(
    () => expenses.filter((expense) => !isSettlementEntry(expense)),
    [expenses],
  );

  const settlements = useMemo(() => expenses.filter(isSettlementEntry), [expenses]);

  const totalCost = useMemo(
    () => regularExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [regularExpenses],
  );

  const totalSettled = useMemo(
    () => settlements.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [settlements],
  );

  // DODAŁEM: Szukamy imienia aktywnego użytkownika
  const activeUserName = useMemo(
    () => users.find((u) => u.id === activeUserId)?.name ?? "Nieznany",
    [users, activeUserId],
  );

  const tripIdShort = tripId.split("-")[0]?.toUpperCase() ?? "01103";

  const issuedAt = new Date().toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="from-theme-primary/10 selection:bg-theme-primary/30 border-theme-border text-theme-text/90 mx-auto w-full max-w-sm rounded-2xl border bg-linear-to-b to-transparent p-6 font-mono shadow-2xl">
      {/* DODAŁEM: activeUserName */}
      <ReceiptHeader
        tripIdShort={tripIdShort}
        issuedAt={issuedAt}
        activeUserName={activeUserName}
        onAddExpense={onAddExpense}
      />

      <ReceiptExpenseList expenses={regularExpenses} users={users} />

      <ReceiptSummary totalSettled={totalSettled} totalCost={totalCost} />

      <ReceiptPaymentSection
        settlements={settlements}
        users={users}
        activeUserId={activeUserId}
        balance={balance}
        debts={debts}
        receivables={receivables}
        onDataChanged={onDataChanged}
      />

      <ReceiptFooter tripIdShort={tripIdShort} />
    </div>
  );
});
