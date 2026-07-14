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
      <div className="border-theme-border mt-3 flex flex-col gap-1.5 border-t border-dashed pt-4 text-[12px] uppercase">
        <div className="text-theme-text/80 flex justify-between font-bold">
          <span>Wydatki razem</span>
          <span>{totalCost.toFixed(2)}</span>
        </div>
        <div className="text-theme-text/80 flex justify-between font-bold">
          <span>Spłacono razem</span>
          <span>{totalSettled.toFixed(2)}</span>
        </div>

        <div className="text-theme-text mt-2 flex justify-between text-[17px] font-bold tracking-wider">
          <span>Suma PLN</span>
          <span>{totalCost.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
});
