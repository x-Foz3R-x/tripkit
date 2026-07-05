"use client";

import { memo, useMemo, useState } from "react";
import type { Database } from "~/types/database";
import type { FinanceExpense } from "~/lib/finances";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

interface ReceiptExpenseListProps {
  expenses: FinanceExpense[];
  users: User[];
}

const INITIAL_VISIBLE_EXPENSES = 3;

export const ReceiptExpenseList = memo(function ReceiptExpenseList({
  expenses,
  users,
}: ReceiptExpenseListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getUserName = (userId: string) => users.find((user) => user.id === userId)?.name ?? "?";

  if (newestFirstExpenses.length === 0) {
    return <p className="text-theme-muted py-6 text-center text-[12px] uppercase">Brak wpisów</p>;
  }

  return (
    <div className="mt-2 flex flex-col gap-4">
      {visibleExpenses.map((expense) => {
        const payer = getUserName(expense.user_id);
        const isAll = expense.split_among.length === users.length;

        const splitNames = isAll
          ? "WSZYSCY"
          : expense.split_among.map((id) => getUserName(id)).join(", ");

        const date = expense.created_at
          ? new Date(expense.created_at).toLocaleString("pl-PL", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return (
          <div
            key={expense.id}
            className="flex flex-col border-b border-dashed border-white/10 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13px] leading-snug font-bold text-white uppercase">
                {expense.description}
              </span>

              <div className="flex shrink-0 items-baseline gap-1.5">
                <span className="text-[14px] font-bold text-white">
                  {Number(expense.amount).toFixed(2)}
                </span>
              </div>
            </div>

            <span className="text-theme-muted text-[11px] uppercase">
              PŁATNIK: <span className="text-white/80">{payer}</span>
            </span>

            <span className="text-theme-muted/80 mt-1 block text-[9px] leading-snug uppercase">
              PODZIAŁ: <span className="text-white/70">{splitNames}</span>
            </span>

            <span className="text-theme-muted/40 mt-2 text-[9px] tracking-tighter uppercase">
              {date}
            </span>
          </div>
        );
      })}

      {hasMoreExpenses && (
        <button
          type="button"
          onClick={() => setIsExpanded((previous) => !previous)}
          className="text-theme-primary border-theme-primary/25 hover:bg-theme-primary/5 rounded-md border border-dashed px-3 py-2 text-[10px] font-bold tracking-[0.12em] uppercase transition active:scale-[0.99]"
        >
          {isExpanded ? "Zwiń do 3 najnowszych" : `Pokaż więcej (${hiddenExpensesCount})`}
        </button>
      )}
    </div>
  );
});
