"use client";

import { memo, useMemo, useState } from "react";
import type { Database } from "~/types/database";
import {
  formatFinanceAmount,
  getExplicitExpenseShares,
  getExpenseParticipantShares,
  type FinanceExpense,
  type FinanceMode,
} from "~/lib/finances";
import { ResponsiveDialog } from "~/components/responsive-dialog";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

interface ReceiptExpenseListProps {
  expenses: FinanceExpense[];
  users: User[];
  financeMode: FinanceMode;
}

const INITIAL_VISIBLE_EXPENSES = 4;

export const ReceiptExpenseList = memo(function ReceiptExpenseList({
  expenses,
  users,
  financeMode,
}: ReceiptExpenseListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<FinanceExpense | null>(null);
  const newestFirstExpenses = useMemo(
    () =>
      [...expenses].sort((first, second) => {
        const firstDate = first.created_at ? new Date(first.created_at).getTime() : 0;
        const secondDate = second.created_at ? new Date(second.created_at).getTime() : 0;
        return secondDate - firstDate;
      }),
    [expenses],
  );
  const hasMoreExpenses = newestFirstExpenses.length > INITIAL_VISIBLE_EXPENSES;
  const visibleExpenses =
    isExpanded || !hasMoreExpenses
      ? newestFirstExpenses
      : newestFirstExpenses.slice(0, INITIAL_VISIBLE_EXPENSES);
  const hiddenExpensesCount = newestFirstExpenses.length - INITIAL_VISIBLE_EXPENSES;
  const getUserName = (userId: string) =>
    users.find((user) => user.id === userId)?.name ?? "Nieznany";
  const selectedShares = selectedExpense
    ? getExpenseParticipantShares(selectedExpense, financeMode)
    : [];

  return (
    <>
      <section className="mt-5">
        <div className="border-receipt-line grid grid-cols-[2rem_1fr_auto] border-b border-dashed pb-1 text-[10px] font-bold uppercase">
          <span>LP</span>
          <span>Nazwa / płatnik</span>
          <span>PLN</span>
        </div>

        {visibleExpenses.length === 0 ? (
          <p className="text-receipt-muted border-receipt-line border-b border-dashed py-6 text-center text-[10px] font-semibold uppercase">
            Brak pozycji na paragonie
          </p>
        ) : (
          <ol>
            {visibleExpenses.map((expense, index) => {
              const participantShares = getExpenseParticipantShares(expense, financeMode);
              const participantNames = participantShares.map((share) => getUserName(share.userId));
              const includesEveryone =
                participantShares.length === users.length &&
                users.every((user) =>
                  participantShares.some((share) => share.userId === user.id && share.amount > 0),
                );
              return (
                <li key={expense.id} className="border-receipt-line border-b border-dotted">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(expense)}
                    className="grid min-h-16 w-full grid-cols-[2rem_1fr_auto] gap-y-1 py-2.5 text-left"
                    aria-label={`Pokaż szczegóły wydatku ${expense.description}`}
                  >
                    <span className="text-receipt-muted text-[10px] font-semibold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-receipt-ink min-w-0 pr-2 text-xs leading-tight font-black uppercase">
                      {expense.description}
                    </span>
                    <span className="text-receipt-ink text-right text-xs font-black">
                      {formatFinanceAmount(Number(expense.amount), financeMode)}
                    </span>
                    <span />
                    <span className="text-receipt-muted col-span-2 text-[10px] leading-snug font-semibold">
                      Płaci: {getUserName(expense.user_id)}
                    </span>
                    <span />
                    <span className="text-receipt-muted col-span-2 text-[10px] leading-snug">
                      Liczeni:{" "}
                      {includesEveryone ? "Wszyscy" : participantNames.join(", ") || "brak"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {hasMoreExpenses && (
          <button
            type="button"
            onClick={() => setIsExpanded((previous) => !previous)}
            className="text-receipt-stamp mt-2 min-h-10 w-full text-[10px] font-black tracking-widest uppercase"
          >
            {isExpanded ? "— Zwiń historię —" : `— Starsze pozycje: ${hiddenExpensesCount} —`}
          </button>
        )}
      </section>

      <ResponsiveDialog
        isOpen={selectedExpense !== null}
        setIsOpen={(isOpen) => {
          if (!isOpen) setSelectedExpense(null);
        }}
        title={selectedExpense?.description}
        description="Szczegóły pozycji na paragonie"
      >
        {selectedExpense && (
          <div className="space-y-5">
            <dl className="border-theme-border divide-theme-border divide-y overflow-hidden rounded-2xl border">
              <ExpenseDetailRow
                label="Kwota"
                value={formatFinanceAmount(Number(selectedExpense.amount), financeMode, {
                  currency: true,
                })}
              />
              <ExpenseDetailRow label="Zapłacił/a" value={getUserName(selectedExpense.user_id)} />
              <ExpenseDetailRow
                label="Wpisał/a"
                value={getUserName(selectedExpense.created_by ?? selectedExpense.user_id)}
              />
              <ExpenseDetailRow
                label="Podział"
                value={
                  getExplicitExpenseShares(selectedExpense).length > 0
                    ? "Kwoty wpisane ręcznie"
                    : "Równo między wskazane osoby"
                }
              />
              <ExpenseDetailRow
                label="Dodano"
                value={
                  selectedExpense.created_at
                    ? new Intl.DateTimeFormat("pl-PL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(selectedExpense.created_at))
                    : "Brak daty"
                }
              />
            </dl>

            <section>
              <h3 className="text-theme-text text-sm font-bold">Kto został policzony</h3>
              <div className="border-theme-border mt-2 overflow-hidden rounded-2xl border">
                {selectedShares.map((share) => (
                  <div
                    key={share.userId}
                    className="border-theme-border flex min-h-12 items-center justify-between gap-4 border-b px-4 last:border-b-0"
                  >
                    <span className="text-theme-text text-sm">{getUserName(share.userId)}</span>
                    <span className="text-theme-primary text-sm font-bold">
                      {formatFinanceAmount(share.amount, financeMode, { currency: true })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
});

function ExpenseDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4">
      <dt className="text-theme-muted text-sm">{label}</dt>
      <dd className="text-theme-text text-right text-sm font-bold">{value}</dd>
    </div>
  );
}
