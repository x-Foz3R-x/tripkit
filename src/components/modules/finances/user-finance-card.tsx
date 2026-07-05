// src/components/modules/finances/user-finance-card.tsx
"use client";

import { useState } from "react";
import { Avatar } from "~/components/ui/avatar";
import { Check, HandCoins, X } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import type { Database } from "~/types/database";
import type { Transaction } from "~/lib/finances";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

interface UserFinanceCardProps {
  user: User;
  balance: number;
  debts: Transaction[];
  receivables: Transaction[];
  allUsers: User[];
  activeUserId: string;
  onSettled: () => void;
}

export function UserFinanceCard({
  user,
  balance,
  debts,
  receivables,
  allUsers,
  activeUserId,
  onSettled,
}: UserFinanceCardProps) {
  const [isSettlingTo, setIsSettlingTo] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const isOwnCard = user.id === activeUserId;

  const handleSettle = async (creditorId: string, amount: number) => {
    setIsSettlingTo(creditorId);

    const { error } = await supabase.from("expenses").insert({
      trip_id: env.NEXT_PUBLIC_TRIP_ID,
      user_id: user.id,
      amount,
      description: "Spłata długu",
      split_among: [creditorId],
    });

    setIsSettlingTo(null);
    setConfirmingId(null);
    if (!error) onSettled();
    else console.error("Błąd zapisu spłaty:", error);
  };

  const isCompletelyClear = debts.length === 0 && receivables.length === 0;

  return (
    <div
      className={`bg-theme-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-opacity ${
        isCompletelyClear ? "border-white/5 opacity-60" : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <span className="font-body text-theme-text text-lg font-bold">{user.name}</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-theme-muted font-body text-[10px] font-bold tracking-wider uppercase">
            Bilans Netto
          </span>
          {isCompletelyClear ? (
            <span className="font-body text-theme-accent font-medium">Rozliczony</span>
          ) : (
            <span
              key={balance}
              className={`animate-fade-in font-mono text-sm font-bold ${
                balance > 0
                  ? "text-theme-accent"
                  : balance < 0
                    ? "text-theme-primary"
                    : "text-white/80"
              }`}
            >
              {balance > 0 ? "+" : ""}
              {balance.toFixed(2)} zł
            </span>
          )}
        </div>
      </div>

      {!isCompletelyClear && (
        <div className="flex flex-col gap-4 px-4 py-3">
          {debts.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-theme-muted/80 mb-1 border-b border-white/5 pb-1 text-[11px] font-bold tracking-wider uppercase">
                Musi oddać
              </span>
              {debts.map((d, i) => {
                const creditor = allUsers.find((u) => u.id === d.to)?.name ?? "Nieznany";
                const isProcessing = isSettlingTo === d.to;
                const isConfirming = confirmingId === d.to;

                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-body pl-1 font-medium text-white/90">{creditor}</span>

                    {isConfirming ? (
                      <div className="animate-fade-in flex items-center gap-2">
                        <span className="font-body text-theme-muted text-xs whitespace-nowrap">
                          Na pewno oddane?
                        </span>
                        <button
                          disabled={isProcessing}
                          onClick={() => void handleSettle(d.to, d.amount)}
                          aria-label={`Potwierdź spłatę dla ${creditor}`}
                          className="bg-theme-accent/20 text-theme-accent hover:bg-theme-accent focus-visible:ring-theme-accent focus-visible:ring-offset-theme-card flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => setConfirmingId(null)}
                          aria-label="Anuluj"
                          className="bg-theme-bg text-theme-muted focus-visible:ring-offset-theme-card flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 active:scale-95"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-theme-primary font-mono font-bold">
                          {d.amount.toFixed(2)} zł
                        </span>
                        {isOwnCard && (
                          <button
                            onClick={() => setConfirmingId(d.to)}
                            className="bg-theme-primary/20 font-body text-theme-primary hover:bg-theme-primary focus-visible:ring-theme-primary focus-visible:ring-offset-theme-card flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
                          >
                            <HandCoins size={14} />
                            Spłać
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {receivables.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-theme-accent/70 mt-1 mb-1 border-b border-white/5 pb-1 text-[11px] font-bold tracking-wider uppercase">
                Czeka na zwrot od
              </span>
              {receivables.map((r, i) => {
                const debtor = allUsers.find((u) => u.id === r.from)?.name ?? "Nieznany";
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-body text-theme-muted pl-1 font-medium">{debtor}</span>
                    <span className="text-theme-accent/80 font-mono font-medium">
                      {r.amount.toFixed(2)} zł
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
