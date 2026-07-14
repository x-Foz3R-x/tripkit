"use client";

import { memo } from "react";
import { Landmark, Plus } from "lucide-react";

interface ReceiptHeaderProps {
  tripIdShort: string;
  issuedAt: string;
  activeUserName: string;
  onAddExpense: () => void;
}

export const ReceiptHeader = memo(function ReceiptHeader({
  tripIdShort,
  issuedAt,
  activeUserName,
  onAddExpense,
}: ReceiptHeaderProps) {
  return (
    <div className="flex flex-col items-center pb-4 text-center">
      <div className="border-theme-border text-theme-text/80 mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-2">
        <Landmark size={17} strokeWidth={2} />

        <span className="text-[11px] font-bold tracking-[0.16em] uppercase">Skarbiec Wyjazdu</span>
      </div>

      <p className="text-theme-text/80 text-[10px] font-bold tracking-tight uppercase">
        Codziennie równe rachunki
      </p>

      <div className="text-theme-muted/70 mt-2 flex w-3/4 justify-between">
        <span className="text-[10px]">NIP 213769420</span>
        <span className="text-[10px]">nr {tripIdShort}</span>
      </div>

      <div className="text-theme-muted/70 mt-1 flex w-3/4 justify-between">
        <span className="text-[10px]">KLIENT: {activeUserName}</span>
        <span className="text-[10px]">STAN. 01</span>
      </div>

      <p className="text-theme-text mt-4 text-[15px] font-bold tracking-widest uppercase">
        Paragon Wyjazdowy
      </p>

      <p className="text-theme-muted/60 mt-1 text-[9px] tracking-tight uppercase">
        Wystawiono {issuedAt}
      </p>

      <button
        type="button"
        onClick={onAddExpense}
        className="border-theme-primary/35 bg-theme-primary/5 text-theme-primary hover:bg-theme-primary/10 mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed py-3 text-[11px] font-bold tracking-[0.16em] uppercase transition active:scale-[0.99]"
      >
        <Plus size={15} strokeWidth={2.5} />
        Dopisz wydatek
      </button>
    </div>
  );
});
