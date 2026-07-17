"use client";

import { memo, useMemo } from "react";
import type { Database } from "~/types/database";
import {
  isSettlementEntry,
  type FinanceExpense,
  type FinanceMode,
  type SettlementStrategy,
  type Transaction,
} from "~/lib/finances";
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
  financeMode: FinanceMode;
  settlementStrategy: SettlementStrategy;
  relationalTransactions: Transaction[];
  optimizedTransactions: Transaction[];
  onDataChanged: () => void;
  onAddExpense: () => void;
  readOnly: boolean;
  canManageExpenses: boolean;
}

export const ExpenseReceipt = memo(function ExpenseReceipt({
  expenses,
  users,
  activeUserId,
  balance,
  debts,
  receivables,
  financeMode,
  settlementStrategy,
  relationalTransactions,
  optimizedTransactions,
  onDataChanged,
  onAddExpense,
  readOnly,
  canManageExpenses,
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
  const outstandingTotal = useMemo(
    () =>
      (settlementStrategy === "optimized" ? optimizedTransactions : relationalTransactions).reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      ),
    [optimizedTransactions, relationalTransactions, settlementStrategy],
  );
  const activeUserName = users.find((user) => user.id === activeUserId)?.name ?? "Uczestnik";
  const tripIdShort = tripId.split("-")[0]?.toUpperCase() ?? "00000000";
  const issuedAt = new Date().toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const isEmpty = expenses.length === 0;

  return (
    <section className="thermal-receipt text-receipt-ink -mx-2 mt-4 w-auto max-w-none px-5 py-7 font-mono">
      <ReceiptHeader
        tripIdShort={tripIdShort}
        issuedAt={issuedAt}
        activeUserName={activeUserName}
        financeMode={financeMode}
        isEmpty={isEmpty}
        onAddExpense={readOnly ? undefined : onAddExpense}
      />
      <ReceiptExpenseList
        expenses={regularExpenses}
        users={users}
        financeMode={financeMode}
        canManageExpenses={canManageExpenses}
        onDataChanged={onDataChanged}
      />
      <ReceiptSummary
        outstandingTotal={outstandingTotal}
        totalCost={totalCost}
        financeMode={financeMode}
      />
      {!isEmpty && (
        <>
          <ReceiptPaymentSection
            settlements={settlements}
            users={users}
            activeUserId={activeUserId}
            balance={balance}
            debts={debts}
            receivables={receivables}
            financeMode={financeMode}
            settlementStrategy={settlementStrategy}
            relationalTransactions={relationalTransactions}
            optimizedTransactions={optimizedTransactions}
            onDataChanged={onDataChanged}
            readOnly={readOnly}
          />
          <ReceiptFooter tripIdShort={tripIdShort} />
        </>
      )}
    </section>
  );
});
