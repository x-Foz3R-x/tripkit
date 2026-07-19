"use client";

import { memo } from "react";
import { formatFinanceAmount, type FinanceMode } from "~/lib/finances";

interface ReceiptSummaryProps {
  totalCost: number;
  outstandingTotal: number;
  financeMode: FinanceMode;
}

export const ReceiptSummary = memo(function ReceiptSummary({
  totalCost,
  outstandingTotal,
  financeMode,
}: ReceiptSummaryProps) {
  return (
    <dl className="border-receipt-ink mt-4 border-y-2 py-3 uppercase">
      <div className="flex items-end justify-between gap-3">
        <dt className="text-receipt-ink text-sm font-black tracking-wider">Suma PLN</dt>
        <dd className="text-receipt-ink text-base font-black">
          {formatFinanceAmount(totalCost, financeMode)}
        </dd>
      </div>
      <div className="text-receipt-muted mt-1.5 flex justify-between gap-3 text-[10px] font-semibold">
        <dt>Pozostało między Wami</dt>
        <dd>{formatFinanceAmount(outstandingTotal, financeMode)}</dd>
      </div>
    </dl>
  );
});
