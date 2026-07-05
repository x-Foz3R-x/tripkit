// src/components/modules/finances/user-finance-card.tsx
"use client";

import { useState } from "react";
import { Avatar } from "~/components/ui/avatar";
import { HandCoins } from "lucide-react";
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
  onSettled: () => void;
}

export function UserFinanceCard({
  user,
  balance,
  debts,
  receivables,
  allUsers,
  onSettled,
}: UserFinanceCardProps) {
  const [isSettlingTo, setIsSettlingTo] = useState<string | null>(null);

  const handleSettle = async (creditorId: string, amount: number) => {
    setIsSettlingTo(creditorId);

    const { error } = await supabase.from("expenses").insert({
      trip_id: env.NEXT_PUBLIC_TRIP_ID,
      user_id: user.id,
      amount: amount,
      description: "Spłata długu",
      split_among: [creditorId],
    });

    setIsSettlingTo(null);
    if (!error) {
      onSettled();
    }
  };

  const isCompletelyClear = debts.length === 0 && receivables.length === 0;

  return (
    <div
      className={`bg-theme-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-opacity ${
        isCompletelyClear ? "border-white/5 opacity-60" : "border-white/10"
      }`}
    >
      {/* 1. WSPÓLNY NAGŁÓWEK - Bilans Netto */}
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
            <span className="font-body font-medium text-emerald-400/80">Rozliczony</span>
          ) : (
            <span
              className={`font-mono text-sm font-bold ${balance > 0 ? "text-theme-accent" : balance < 0 ? "text-theme-primary" : "text-white/80"}`}
            >
              {balance > 0 ? "+" : ""}
              {balance.toFixed(2)} zł
            </span>
          )}
        </div>
      </div>

      {/* 2. SZCZEGÓŁY KARTY */}
      {!isCompletelyClear && (
        <div className="flex flex-col gap-4 px-4 py-3">
          {/* SEKCJA: Długi do spłaty */}
          {debts.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-theme-muted/80 mb-1 border-b border-white/5 pb-1 text-[11px] font-bold tracking-wider uppercase">
                Musi oddać
              </span>
              {debts.map((d, i) => {
                const creditor = allUsers.find((u) => u.id === d.to)?.name ?? "Nieznany";
                const isProcessing = isSettlingTo === d.to;

                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-body pl-1 font-medium text-white/90">{creditor}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-theme-primary font-mono font-bold">
                        {d.amount.toFixed(2)} zł
                      </span>
                      <button
                        disabled={isProcessing}
                        onClick={() => void handleSettle(d.to, d.amount)}
                        className="bg-theme-primary/20 font-body text-theme-primary hover:bg-theme-primary flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors hover:text-white active:scale-95 disabled:opacity-50"
                      >
                        <HandCoins size={14} />
                        {isProcessing ? "..." : "Spłać"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SEKCJA: Wierzytelności */}
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
