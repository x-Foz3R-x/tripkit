"use client";

import { memo } from "react";

interface ReceiptSummaryProps {
  hasExpenses: boolean;
  groupTotal: number;
  partialTotal: number;
  totalTripCost: number;
}

export const ReceiptSummary = memo(function ReceiptSummary({
  hasExpenses,
  groupTotal,
  partialTotal,
  totalTripCost,
}: ReceiptSummaryProps) {
  return (
    <>
      {hasExpenses && (
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
    </>
  );
});
