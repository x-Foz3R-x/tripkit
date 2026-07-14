"use client";

import { memo, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, HelpCircle, X } from "lucide-react";
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

// Zaktualizowany typ o 'phone'
type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name"> & {
  phone?: string | null;
};

interface ReceiptPaymentSectionProps {
  settlements: FinanceExpense[];
  users: User[];
  activeUserId: string;
  balance: number;
  debts: Transaction[];
  receivables: Transaction[];
  onDataChanged: () => void;
}

const INITIAL_VISIBLE_SETTLEMENTS = 3;
const HELP_DISMISSED_KEY = "tripkit_settlement_help_dismissed";

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
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(HELP_DISMISSED_KEY) === "true") {
      setIsHelpVisible(false);
    }
  }, []);

  const dismissHelp = () => {
    localStorage.setItem(HELP_DISMISSED_KEY, "true");
    setIsHelpVisible(false);
  };

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

  const hasMoreSettlements = settlements.length > INITIAL_VISIBLE_SETTLEMENTS;
  const visibleSettlements =
    isLedgerExpanded || !hasMoreSettlements
      ? settlements
      : settlements.slice(0, INITIAL_VISIBLE_SETTLEMENTS);
  const hiddenSettlementsCount = settlements.length - INITIAL_VISIBLE_SETTLEMENTS;

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
    <div className="border-theme-border mt-5 flex flex-col gap-3 border-t border-dashed pt-4">
      <div className="flex items-center justify-between">
        <span className="text-theme-muted/80 text-[12px] font-bold tracking-widest uppercase">
          Rozliczenie płatności
        </span>

        <button
          type="button"
          onClick={() => setIsHelpVisible((previous) => !previous)}
          aria-label="Jak działa rozliczanie?"
          className="text-theme-muted/60 hover:text-theme-primary -m-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <HelpCircle size={16} />
        </button>
      </div>

      {isHelpVisible && (
        <div className="border-theme-muted/25 bg-theme-text/3 flex flex-col gap-1.5 rounded-lg border border-dashed px-3 py-3 text-[11px] normal-case">
          <div className="flex items-start justify-between gap-2">
            <span className="text-theme-muted/80 text-[10px] font-bold tracking-wider uppercase">
              Jak to działa
            </span>

            <button
              type="button"
              onClick={dismissHelp}
              aria-label="Zwiń instrukcję"
              className="text-theme-muted/50 hover:text-theme-text -m-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            >
              <X size={13} />
            </button>
          </div>

          <ol className="text-theme-muted/75 flex list-decimal flex-col gap-1 pl-4 leading-snug">
            <li>
              Wysłałeś komuś przelew? Wejdź w &quot;Musisz oddać&quot; i kliknij{" "}
              <span className="text-theme-accent font-bold">zgłoś przelew</span>.
            </li>
            <li>Odbiorca zobaczy Twoje zgłoszenie i potwierdzi, że pieniądze doszły.</li>
            <li>Dopiero po potwierdzeniu Twój bilans się zaktualizuje.</li>
          </ol>
        </div>
      )}

      {actionError && (
        <div className="border-theme-primary/30 bg-theme-primary/5 text-theme-primary rounded-lg border border-dashed px-3 py-2 text-[11px]">
          {actionError}
        </div>
      )}

      {settlements.length > 0 && (
        <div className="border-theme-border flex flex-col gap-2 border-b border-dashed pb-3">
          <span className="text-theme-muted/60 text-[10px] font-bold tracking-wider uppercase">
            Rejestr wpłat
          </span>

          {visibleSettlements.map((settlement) => {
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
                className="flex items-center justify-between gap-3 text-[11px] uppercase"
              >
                <span className="text-theme-text/70">
                  {debtor} → {recipient}
                </span>

                <span className={`${statusClass} shrink-0 font-bold`}>
                  {Number(settlement.amount).toFixed(2)} · {statusLabel}
                </span>
              </div>
            );
          })}

          {hasMoreSettlements && (
            <button
              type="button"
              onClick={() => setIsLedgerExpanded((previous) => !previous)}
              className="text-theme-primary border-theme-primary/25 hover:bg-theme-primary/5 mt-1 rounded-md border border-dashed px-3 py-2 text-[11px] font-bold tracking-widest uppercase transition active:scale-[0.99]"
            >
              {isLedgerExpanded
                ? "Zwiń do 3 najnowszych"
                : `Pokaż więcej (${hiddenSettlementsCount})`}
            </button>
          )}
        </div>
      )}

      {isFullySettled ? (
        <div className="border-theme-accent/30 bg-theme-accent/5 flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5">
          <span className="text-theme-accent font-body text-[13px] font-bold uppercase">
            Wszystko rozliczone
          </span>

          <Check size={16} className="text-theme-accent" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-[13px] uppercase">
          {pendingIncoming.length > 0 && (
            <div className="border-theme-primary/25 bg-theme-primary/5 flex flex-col gap-2.5 rounded-lg border border-dashed p-3">
              <span className="text-theme-primary text-[11px] font-bold tracking-wider">
                Do potwierdzenia
              </span>

              {pendingIncoming.map((settlement) => {
                const debtor = getUserName(settlement.user_id);
                const isConfirming = processingKey === `confirmed:${settlement.id}`;
                const isRejecting = processingKey === `rejected:${settlement.id}`;

                return (
                  <div
                    key={settlement.id}
                    className="border-theme-border flex flex-col gap-2 border-t border-dashed pt-2.5 first:border-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-theme-text/90 flex items-center gap-1.5">
                        <ArrowDownLeft size={14} className="text-theme-accent shrink-0" />
                        {debtor}
                      </span>

                      <span className="text-theme-accent font-bold">
                        {Number(settlement.amount).toFixed(2)}
                      </span>
                    </div>

                    <span className="text-theme-muted text-[10px] normal-case">
                      {debtor} zgłasza, że wysłał przelew.
                    </span>

                    <div className="flex items-center gap-2 normal-case">
                      <button
                        type="button"
                        disabled={isConfirming || isRejecting}
                        onClick={() => void handleSettlementDecision(settlement.id, "confirmed")}
                        className="text-theme-accent border-theme-accent/40 rounded-md border border-dashed px-3 py-2 text-[12px] font-bold disabled:opacity-40"
                      >
                        {isConfirming ? "zapis..." : "wpłynęło"}
                      </button>

                      <button
                        type="button"
                        disabled={isConfirming || isRejecting}
                        onClick={() => void handleSettlementDecision(settlement.id, "rejected")}
                        className="text-theme-muted border-theme-muted/30 rounded-md border border-dashed px-3 py-2 text-[12px] font-bold disabled:opacity-40"
                      >
                        {isRejecting ? "zapis..." : "nie ma"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {debts.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-theme-muted/60 text-[11px] tracking-wider">Musisz oddać</span>

              {debts.map((debt) => {
                const creditorObj = users.find((u) => u.id === debt.to);
                const creditor = creditorObj?.name ?? "Nieznany";
                const creditorPhone = creditorObj?.phone; // Pobieramy numer

                const pending = findPendingToRecipient(debt.to);
                const isConfirming = confirmingDebtTo === debt.to;
                const isReporting = processingKey === `report:${debt.to}`;

                return (
                  <div
                    key={debt.to}
                    className="border-theme-border flex items-center justify-between gap-2 border-t border-dashed pt-2 first:border-0 first:pt-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-theme-text/90 flex items-center gap-1.5">
                        <ArrowUpRight size={14} className="text-theme-primary shrink-0" />
                        {creditor}
                      </span>

                      {/* Wyświetlanie BLIK jeśli numer istnieje */}
                      {creditorPhone && (
                        <span className="text-theme-muted/70 mt-0.5 ml-5 font-mono text-[9px] tracking-widest uppercase">
                          BLIK:{" "}
                          <a
                            href={`tel:${creditorPhone.replace(/\s/g, "")}`}
                            className="text-theme-text/80 underline decoration-dotted underline-offset-2"
                          >
                            {creditorPhone}
                          </a>
                        </span>
                      )}
                    </div>

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
                          className="text-theme-accent border-theme-accent/40 rounded-md border border-dashed px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40"
                        >
                          {isReporting ? "zapis..." : "TAK"}
                        </button>

                        <button
                          type="button"
                          disabled={isReporting}
                          onClick={() => setConfirmingDebtTo(null)}
                          className="text-theme-muted border-theme-muted/30 rounded-md border border-dashed px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40"
                        >
                          NIE
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
                          className="text-theme-primary border-theme-primary/40 rounded-md border border-dashed px-2.5 py-1.5 text-[11px] font-bold normal-case"
                        >
                          zgłoś przelew
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {receivables.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-theme-muted/60 text-[11px] tracking-wider">
                Czekasz na zwrot od
              </span>

              {receivables.map((receivable) => {
                const debtor = getUserName(receivable.from);
                const pendingAmount = pendingAmountFromDebtor(receivable.from);

                return (
                  <div key={receivable.from} className="flex items-center justify-between gap-2">
                    <span className="text-theme-text/70 flex items-center gap-1.5">
                      <ArrowDownLeft size={14} className="text-theme-accent/70 shrink-0" />
                      {debtor}
                    </span>

                    <div className="flex items-center gap-2">
                      {pendingAmount > 0 && (
                        <span className="text-theme-primary text-[10px] font-bold normal-case">
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
            <div className="border-theme-border flex flex-col gap-2.5 border-t border-dashed pt-3">
              <span className="text-theme-muted/60 text-[11px] tracking-wider">
                Oczekuje na potwierdzenie
              </span>

              {pendingOutgoing.map((settlement) => {
                const recipientId = getSettlementRecipientId(settlement);

                return (
                  <div key={settlement.id} className="flex items-center justify-between">
                    <span className="text-theme-text/70 flex items-center gap-1.5">
                      <ArrowUpRight size={14} className="text-theme-primary/70 shrink-0" />
                      {getUserName(recipientId ?? "")}
                    </span>

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

      <div className="bg-theme-primary/10 border-theme-primary/20 relative -mx-2 mt-1 flex justify-between overflow-hidden rounded-lg border px-3 py-3 text-[16px] font-bold uppercase">
        <div className="bg-theme-primary/5 absolute inset-0 mix-blend-overlay" />

        <span className="text-theme-text relative z-10">Twój bilans</span>

        <span
          className={`relative z-10 ${
            balance > 0
              ? "text-theme-accent"
              : balance < 0
                ? "text-theme-primary"
                : "text-theme-text"
          }`}
        >
          {balance > 0 ? "+" : ""}
          {balance.toFixed(2)} PLN
        </span>
      </div>
    </div>
  );
});
