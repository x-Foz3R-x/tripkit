"use client";

import { memo } from "react";
import { getFinanceModeLabel, type FinanceMode } from "~/lib/finances";

interface ReceiptHeaderProps {
  tripIdShort: string;
  issuedAt: string;
  activeUserName: string;
  financeMode: FinanceMode;
  isEmpty: boolean;
  onAddExpense?: () => void;
}

export const ReceiptHeader = memo(function ReceiptHeader({
  tripIdShort,
  issuedAt,
  activeUserName,
  financeMode,
  isEmpty,
  onAddExpense,
}: ReceiptHeaderProps) {
  return (
    <header className="text-center">
      <p className="text-receipt-ink text-[10px] font-bold tracking-[0.32em] uppercase">
        Wyjezdnik
      </p>
      <h1 className="text-receipt-ink mt-1 text-base leading-tight font-black tracking-[0.08em] uppercase">
        Rozliczenia wyjazdu
      </h1>
      <p className="text-receipt-muted mt-1 text-[9px] uppercase">Centrala równych rachunków</p>
      <p className="text-receipt-muted text-[9px] uppercase">NIP 213-769-42-00 · KASA 01</p>

      <div className="border-receipt-line my-4 border-y border-dashed py-2">
        <p className="text-receipt-ink text-xs font-black tracking-[0.16em] uppercase">
          Paragon wyjazdowy
        </p>
        <p className="text-receipt-muted mt-1 text-[9px] uppercase">
          {issuedAt} · NR {tripIdShort}
        </p>
      </div>

      <dl className="text-receipt-muted grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-[10px] uppercase">
        <dt>Klient</dt>
        <dd className="text-receipt-ink truncate text-right font-bold">{activeUserName}</dd>
        <dt>Rozliczenie</dt>
        <dd className="text-receipt-ink text-right font-bold">
          {getFinanceModeLabel(financeMode)}
        </dd>
      </dl>

      {onAddExpense && (
        <button
          type="button"
          onClick={onAddExpense}
          className="border-receipt-ink text-receipt-ink active:bg-receipt-ink/6 mt-4 min-h-11 w-full border-y border-dashed text-[11px] font-black tracking-[0.14em] uppercase transition"
        >
          {isEmpty ? "+ Dodaj pierwszy wydatek" : "+ Dopisz wydatek"}
        </button>
      )}
    </header>
  );
});
