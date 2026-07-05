/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Check, Landmark, Plus } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import type { Database } from "~/types/database";
import {
  getSettlementRecipientId,
  getSettlementStatus,
  isSettlementEntry,
  type FinanceExpense,
  type SettlementStatus,
  type Transaction,
} from "~/lib/finances";

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
  onPrepareAddExpense?: () => void;
}

const BARCODE_PATTERN = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 1, 4, 2, 1, 1, 3, 2, 1, 4, 1, 2, 1, 1, 3, 2, 1, 1, 2,
];

export function ExpenseReceipt({
  expenses,
  users,
  activeUserId,
  balance,
  debts,
  receivables,
  onDataChanged,
  onAddExpense,
  onPrepareAddExpense,
}: ExpenseReceiptProps) {
  const [confirmingDebtTo, setConfirmingDebtTo] = useState<string | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getUserName = (userId: string) =>
    users.find((user) => user.id === userId)?.name ?? "Nieznany";

  const regularExpenses = expenses.filter((expense) => !isSettlementEntry(expense));

  const settlements = expenses.filter(isSettlementEntry);

  const pendingIncoming = settlements.filter(
    (settlement) =>
      getSettlementStatus(settlement) === "pending" &&
      getSettlementRecipientId(settlement) === activeUserId,
  );

  const pendingOutgoing = settlements.filter(
    (settlement) =>
      getSettlementStatus(settlement) === "pending" && settlement.user_id === activeUserId,
  );

  const totalTripCost = regularExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const groupTotal = regularExpenses
    .filter((expense) => expense.split_among.length === users.length)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const partialTotal = regularExpenses
    .filter((expense) => expense.split_among.length !== users.length)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const tripIdShort = env.NEXT_PUBLIC_TRIP_ID.split("-")[0]?.toUpperCase() ?? "01103";

  const issuedAt = new Date().toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFullySettled =
    debts.length === 0 &&
    receivables.length === 0 &&
    pendingIncoming.length === 0 &&
    pendingOutgoing.length === 0;

  const findPendingToRecipient = (recipientId: string) =>
    pendingOutgoing.find((settlement) => getSettlementRecipientId(settlement) === recipientId);

  const pendingAmountFromDebtor = (debtorId: string) =>
    pendingIncoming
      .filter((settlement) => settlement.user_id === debtorId)
      .reduce((sum, settlement) => sum + Number(settlement.amount), 0);

  const handleReportPayment = async (recipientId: string, amount: number) => {
    const processingId = `report:${recipientId}`;

    setActionError(null);
    setProcessingKey(processingId);

    const { error } = await supabase.from("expenses").insert({
      trip_id: env.NEXT_PUBLIC_TRIP_ID,
      user_id: activeUserId,
      amount,
      description: "Zgłoszona wpłata",
      split_among: [recipientId],
      entry_type: "settlement",
      settlement_status: "pending",
      settlement_recipient_id: recipientId,
      settlement_confirmed_at: null,
      settlement_confirmed_by: null,
    } as never);

    setProcessingKey(null);
    setConfirmingDebtTo(null);

    if (error) {
      console.error("Błąd zgłoszenia wpłaty:", error);
      setActionError("Nie udało się zgłosić wpłaty. Spróbuj ponownie.");
      return;
    }

    onDataChanged();
  };

  const handleSettlementDecision = async (
    settlementId: string,
    status: Extract<SettlementStatus, "confirmed" | "rejected">,
  ) => {
    const processingId = `${status}:${settlementId}`;

    setActionError(null);
    setProcessingKey(processingId);

    const updateData =
      status === "confirmed"
        ? {
            settlement_status: "confirmed",
            settlement_confirmed_at: new Date().toISOString(),
            settlement_confirmed_by: activeUserId,
          }
        : {
            settlement_status: "rejected",
            settlement_confirmed_at: null,
            settlement_confirmed_by: null,
          };

    const { error } = await supabase
      .from("expenses")
      .update(updateData as never)
      .eq("id", settlementId);

    setProcessingKey(null);

    if (error) {
      console.error("Błąd zapisu potwierdzenia:", error);
      setActionError("Nie udało się zapisać decyzji. Spróbuj ponownie.");
      return;
    }

    onDataChanged();
  };

  return (
    <div className="from-theme-primary/10 selection:bg-theme-primary/30 mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-linear-to-b to-transparent p-6 font-mono text-white/90 shadow-2xl">
      <div className="flex flex-col items-center pb-4 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-white/80">
          <Landmark size={17} strokeWidth={2} />
          <span className="text-[11px] font-bold tracking-[0.16em] uppercase">
            Skarbiec Wyjazdu
          </span>
        </div>

        <p className="text-[10px] font-bold tracking-tight text-white/80 uppercase">
          Codziennie równe rachunki
        </p>

        <p className="text-theme-muted mt-0.5 text-[10px] tracking-tight uppercase">
          Główna Kapituła Wyjazdu
        </p>

        <div className="text-theme-muted/70 mt-2 flex w-3/4 justify-between">
          <span className="text-[10px]">NIP 213769420</span>
          <span className="text-[10px]">nr {tripIdShort}</span>
        </div>

        <div className="text-theme-muted/70 mt-1 flex w-3/4 justify-between">
          <span className="text-[10px]">SKARBNIK: Brak</span>
          <span className="text-[10px]">STAN. 01</span>
        </div>

        <p className="mt-4 text-[15px] font-bold tracking-widest text-white uppercase">
          Paragon Wyjazdowy
        </p>

        <p className="text-theme-muted/60 mt-1 text-[9px] tracking-tight uppercase">
          Wystawiono {issuedAt}
        </p>

        <button
          type="button"
          onPointerDown={onPrepareAddExpense}
          onFocus={onPrepareAddExpense}
          onClick={onAddExpense}
          className="border-theme-primary/35 bg-theme-primary/5 text-theme-primary hover:bg-theme-primary/10 mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed py-3 text-[11px] font-bold tracking-[0.16em] uppercase transition active:scale-[0.99]"
        >
          <Plus size={15} strokeWidth={2.5} />
          Dopisz wydatek
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {regularExpenses.length === 0 ? (
          <p className="text-theme-muted py-6 text-center text-[12px] uppercase">Brak wpisów</p>
        ) : (
          regularExpenses.map((expense) => {
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

                    <span className="text-theme-muted text-[11px]">{isAll ? "A" : "B"}</span>
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
          })
        )}
      </div>

      {settlements.length > 0 && (
        <div className="mt-5 flex flex-col gap-2 border-t border-dashed border-white/20 pt-4">
          <span className="text-theme-muted/70 text-[10px] font-bold tracking-widest uppercase">
            Rejestr wpłat
          </span>

          {settlements.map((settlement) => {
            const recipientId = getSettlementRecipientId(settlement);
            const recipient = recipientId ? getUserName(recipientId) : "Nieznany";
            const debtor = getUserName(settlement.user_id);
            const status = getSettlementStatus(settlement);

            const statusLabel =
              status === "pending"
                ? "oczekuje"
                : status === "confirmed"
                  ? "potwierdzono"
                  : "odrzucono";

            const statusClass =
              status === "confirmed"
                ? "text-theme-accent"
                : status === "pending"
                  ? "text-theme-primary"
                  : "text-theme-muted";

            return (
              <div
                key={settlement.id}
                className="flex items-center justify-between gap-3 text-[10px] uppercase"
              >
                <span className="text-white/70">
                  {debtor} → {recipient}
                </span>

                <span className={`${statusClass} shrink-0 font-bold`}>
                  {Number(settlement.amount).toFixed(2)} · {statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {regularExpenses.length > 0 && (
        <div className="text-theme-muted/70 mt-5 flex flex-col gap-1 border-t border-dashed border-white/20 pt-4 text-[10px] uppercase">
          <div className="flex justify-between">
            <span>Grupa A — wszyscy</span>
            <span>{groupTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Grupa B — część ekipy</span>
            <span>{partialTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-white/20 pt-4 text-[12px] uppercase">
        <div className="flex justify-between font-bold text-white/80">
          <span>Wydatki razem</span>
          <span>{totalTripCost.toFixed(2)}</span>
        </div>

        <div className="mt-2 flex justify-between text-[17px] font-bold tracking-wider text-white">
          <span>Suma PLN</span>
          <span>{totalTripCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-dashed border-white/20 pt-4">
        <span className="text-theme-muted/80 text-[11px] font-bold tracking-widest uppercase">
          Rozliczenie płatności
        </span>

        {actionError && (
          <div className="border-theme-primary/30 bg-theme-primary/5 text-theme-primary rounded-lg border border-dashed px-3 py-2 text-[10px]">
            {actionError}
          </div>
        )}

        {isFullySettled ? (
          <div className="border-theme-accent/30 bg-theme-accent/5 flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
            <span className="text-theme-accent font-body text-xs font-bold uppercase">
              Wszystko rozliczone
            </span>

            <Check size={14} className="text-theme-accent" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-[12px] uppercase">
            {pendingIncoming.length > 0 && (
              <div className="border-theme-primary/25 bg-theme-primary/5 flex flex-col gap-2 rounded-lg border border-dashed p-3">
                <span className="text-theme-primary text-[10px] font-bold tracking-wider">
                  Do potwierdzenia
                </span>

                {pendingIncoming.map((settlement) => {
                  const debtor = getUserName(settlement.user_id);
                  const isConfirming = processingKey === `confirmed:${settlement.id}`;
                  const isRejecting = processingKey === `rejected:${settlement.id}`;

                  return (
                    <div
                      key={settlement.id}
                      className="flex flex-col gap-2 border-t border-dashed border-white/10 pt-2 first:border-0 first:pt-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white/90">← {debtor}</span>

                        <span className="text-theme-accent font-bold">
                          {Number(settlement.amount).toFixed(2)}
                        </span>
                      </div>

                      <span className="text-theme-muted text-[9px] normal-case">
                        {debtor} zgłasza, że wysłał przelew.
                      </span>

                      <div className="flex items-center gap-3 normal-case">
                        <button
                          type="button"
                          disabled={isConfirming || isRejecting}
                          onClick={() => void handleSettlementDecision(settlement.id, "confirmed")}
                          className="text-theme-accent text-[11px] font-bold underline decoration-dotted underline-offset-2 disabled:opacity-40"
                        >
                          {isConfirming ? "[ zapis... ]" : "[ wpłynęło ]"}
                        </button>

                        <button
                          type="button"
                          disabled={isConfirming || isRejecting}
                          onClick={() => void handleSettlementDecision(settlement.id, "rejected")}
                          className="text-theme-muted text-[11px] font-bold underline decoration-dotted underline-offset-2 disabled:opacity-40"
                        >
                          {isRejecting ? "[ zapis... ]" : "[ nie ma ]"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {debts.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-theme-muted/60 text-[10px] tracking-wider">Musisz oddać</span>

                {debts.map((debt) => {
                  const creditor = getUserName(debt.to);
                  const pending = findPendingToRecipient(debt.to);
                  const isConfirming = confirmingDebtTo === debt.to;
                  const isReporting = processingKey === `report:${debt.to}`;

                  return (
                    <div key={debt.to} className="flex items-center justify-between gap-2">
                      <span className="text-white/90">→ {creditor}</span>

                      {pending ? (
                        <div className="flex items-center gap-2">
                          <span className="text-theme-primary text-[10px] font-bold normal-case">
                            czeka na potwierdzenie
                          </span>

                          <span className="text-theme-primary font-bold">
                            {Number(pending.amount).toFixed(2)}
                          </span>
                        </div>
                      ) : isConfirming ? (
                        <div className="flex items-center gap-2 normal-case">
                          <span className="text-theme-muted text-[10px] whitespace-nowrap">
                            przelew wysłany?
                          </span>

                          <button
                            type="button"
                            disabled={isReporting}
                            onClick={() => void handleReportPayment(debt.to, debt.amount)}
                            className="text-theme-accent text-[11px] font-bold underline decoration-dotted underline-offset-2 disabled:opacity-40"
                          >
                            {isReporting ? "[ zapis... ]" : "[ TAK ]"}
                          </button>

                          <button
                            type="button"
                            disabled={isReporting}
                            onClick={() => setConfirmingDebtTo(null)}
                            className="text-theme-muted text-[11px] font-bold underline decoration-dotted underline-offset-2 disabled:opacity-40"
                          >
                            [ NIE ]
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-theme-primary font-bold">
                            {debt.amount.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => setConfirmingDebtTo(debt.to)}
                            className="text-theme-primary text-[11px] font-bold normal-case underline decoration-dotted underline-offset-2"
                          >
                            [ zgłoś przelew ]
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {receivables.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-theme-muted/60 text-[10px] tracking-wider">
                  Czeka na zwrot
                </span>

                {receivables.map((receivable) => {
                  const debtor = getUserName(receivable.from);
                  const pendingAmount = pendingAmountFromDebtor(receivable.from);

                  return (
                    <div key={receivable.from} className="flex items-center justify-between gap-2">
                      <span className="text-white/70">← {debtor}</span>

                      <div className="flex items-center gap-2">
                        {pendingAmount > 0 && (
                          <span className="text-theme-primary text-[9px] font-bold normal-case">
                            {pendingAmount.toFixed(2)} czeka
                          </span>
                        )}

                        <span className="text-theme-accent/90 font-bold">
                          {receivable.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pendingOutgoing.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-dashed border-white/10 pt-3">
                <span className="text-theme-muted/60 text-[10px] tracking-wider">
                  Oczekuje na potwierdzenie
                </span>

                {pendingOutgoing.map((settlement) => {
                  const recipientId = getSettlementRecipientId(settlement);

                  return (
                    <div key={settlement.id} className="flex items-center justify-between">
                      <span className="text-white/70">→ {getUserName(recipientId ?? "")}</span>

                      <span className="text-theme-primary font-bold">
                        {Number(settlement.amount).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="bg-theme-primary/10 border-theme-primary/20 relative -mx-2 mt-1 flex justify-between overflow-hidden rounded-lg border px-3 py-2 text-[15px] font-bold uppercase">
          <div className="bg-theme-primary/5 absolute inset-0 mix-blend-overlay" />

          <span className="relative z-10 text-white">Twój bilans</span>

          <span
            className={`relative z-10 ${
              balance > 0 ? "text-theme-accent" : balance < 0 ? "text-theme-primary" : "text-white"
            }`}
          >
            {balance > 0 ? "+" : ""}
            {balance.toFixed(2)} PLN
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1 border-t border-dashed border-white/20 pt-5 text-center text-[13px] leading-none font-bold">
        <span className="text-theme-primary mx-auto mb-1 block w-fit rounded bg-white/10 px-2 py-1">
          GWARANCJA
        </span>

        <span className="tracking-tight text-white/90 uppercase">W naszym Skarbcu</span>

        <span className="tracking-tight text-white/90 uppercase">nie zgubimy</span>

        <span className="mt-1 text-[17px] tracking-widest text-white uppercase">
          żadnej złotówki
        </span>

        <span className="text-theme-muted mt-1 text-[9px] leading-tight font-normal tracking-tighter uppercase">
          (I to nie tylko tych za alko
          <br />
          ale absolutnie za wszystkie zakupy)
        </span>

        <span className="border-theme-primary text-theme-primary mx-auto mt-4 inline-block border-b pb-1 text-[15px] uppercase">
          Skarbiec pamięta
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1">
        <div className="flex h-10 w-full items-center justify-center gap-0.5 opacity-70">
          {BARCODE_PATTERN.map((width, index) => (
            <div key={index} className="h-full bg-white/80" style={{ width: `${width * 1.5}px` }} />
          ))}
        </div>

        <span className="text-theme-muted mt-1 text-[10px] tracking-widest">
          Nr wpisu: {tripIdShort}
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center border-t border-white/10 pt-4">
        <span className="text-theme-muted/70 mb-2 text-[10px] font-bold tracking-widest uppercase">
          Odbierz rabat na 10 PLN
        </span>

        <div className="rounded-xl bg-white p-2">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://www.youtube.com/watch?v=dQw4w9WgXcQ&margin=0"
            alt="Easter Egg QR"
            className="h-20 w-20"
            width={80}
            height={80}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
