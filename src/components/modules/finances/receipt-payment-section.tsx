"use client";

import { memo, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import type { Database } from "~/types/database";
import {
  getSettlementRecipientId,
  getSettlementStatus,
  type FinanceExpense,
  type SettlementStatus,
  type Transaction,
} from "~/lib/finances";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

interface ReceiptPaymentSectionProps {
  settlements: FinanceExpense[];
  users: User[];
  activeUserId: string;
  balance: number;
  debts: Transaction[];
  receivables: Transaction[];
  onDataChanged: () => void;
}

export const ReceiptPaymentSection = memo(function ReceiptPaymentSection({
  settlements,
  users,
  activeUserId,
  balance,
  debts,
  receivables,
  onDataChanged,
}: ReceiptPaymentSectionProps) {
  const [confirmingDebtTo, setConfirmingDebtTo] = useState<string | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getUserName = (userId: string) =>
    users.find((user) => user.id === userId)?.name ?? "Nieznany";

  const pendingIncoming = settlements.filter(
    (settlement) =>
      getSettlementStatus(settlement) === "pending" &&
      getSettlementRecipientId(settlement) === activeUserId,
  );

  const pendingOutgoing = settlements.filter(
    (settlement) =>
      getSettlementStatus(settlement) === "pending" && settlement.user_id === activeUserId,
  );

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
    <div className="mt-5 flex flex-col gap-3 border-t border-dashed border-white/20 pt-4">
      <span className="text-theme-muted/80 text-[11px] font-bold tracking-widest uppercase">
        Rozliczenie płatności
      </span>

      {actionError && (
        <div className="border-theme-primary/30 bg-theme-primary/5 text-theme-primary rounded-lg border border-dashed px-3 py-2 text-[10px]">
          {actionError}
        </div>
      )}

      {settlements.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-dashed border-white/10 pb-3">
          <span className="text-theme-muted/60 text-[10px] font-bold tracking-wider uppercase">
            Rejestr wpłat
          </span>

          {settlements.map((settlement) => {
            const recipientId = getSettlementRecipientId(settlement);
            const debtor = getUserName(settlement.user_id);
            const recipient = getUserName(recipientId ?? "");
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
              <span className="text-theme-muted/60 text-[10px] tracking-wider">Czeka na zwrot</span>

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
  );
});
