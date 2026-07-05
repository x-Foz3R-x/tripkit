"use client";

import { memo, useMemo } from "react";
import { env } from "~/env";
import type { Database } from "~/types/database";
import { isSettlementEntry, type FinanceExpense, type Transaction } from "~/lib/finances";
import { ReceiptHeader } from "~/components/modules/finances/receipt-header";
import { ReceiptExpenseList } from "~/components/modules/finances/receipt-expense-list";
import { ReceiptSummary } from "~/components/modules/finances/receipt-summary";
import { ReceiptPaymentSection } from "~/components/modules/finances/receipt-payment-section";
import { ReceiptFooter } from "~/components/modules/finances/receipt-footer";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

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
  const regularExpenses = useMemo(
    () => expenses.filter((expense) => !isSettlementEntry(expense)),
    [expenses],
  );

  const settlements = useMemo(() => expenses.filter(isSettlementEntry), [expenses]);

  const totalTripCost = useMemo(
    () => regularExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [regularExpenses],
  );

  const groupTotal = useMemo(
    () =>
      regularExpenses
        .filter((expense) => expense.split_among.length === users.length)
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    [regularExpenses, users.length],
  );

  const partialTotal = useMemo(
    () =>
      regularExpenses
        .filter((expense) => expense.split_among.length !== users.length)
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    [regularExpenses, users.length],
  );

  const tripIdShort = env.NEXT_PUBLIC_TRIP_ID.split("-")[0]?.toUpperCase() ?? "01103";

  const issuedAt = new Date().toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="from-theme-primary/10 selection:bg-theme-primary/30 mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-linear-to-b to-transparent p-6 font-mono text-white/90 shadow-2xl">
      <ReceiptHeader tripIdShort={tripIdShort} issuedAt={issuedAt} onAddExpense={onAddExpense} />

      <ReceiptExpenseList expenses={regularExpenses} users={users} />

      <ReceiptSummary
        hasExpenses={regularExpenses.length > 0}
        groupTotal={groupTotal}
        partialTotal={partialTotal}
        totalTripCost={totalTripCost}
      />

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
