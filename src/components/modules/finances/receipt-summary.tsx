"use client";

import { memo } from "react";

interface ReceiptSummaryProps {
  totalCost: number;
  totalSettled: number;
}

export const ReceiptSummary = memo(function ReceiptSummary({
  totalCost,
  totalSettled,
}: ReceiptSummaryProps) {
  return (
    <>
      <div className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-white/20 pt-4 text-[12px] uppercase">
        <div className="flex justify-between font-bold text-white/80">
          <span>Wydatki razem</span>
          <span>{totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-white/80">
          <span>Spłacono razem</span>
          <span>{totalSettled.toFixed(2)}</span>
        </div>

        <div className="mt-2 flex justify-between text-[17px] font-bold tracking-wider text-white">
          <span>Suma PLN</span>
          <span>{totalCost.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
});
