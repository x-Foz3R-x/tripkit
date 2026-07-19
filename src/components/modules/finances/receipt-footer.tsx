"use client";

import { memo } from "react";

interface ReceiptFooterProps {
  tripIdShort: string;
}

const BARCODE_PATTERN = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 1, 4, 2, 1, 1, 3, 2, 1, 4, 1, 3, 1, 2, 2, 1, 3,
];

export const ReceiptFooter = memo(function ReceiptFooter({ tripIdShort }: ReceiptFooterProps) {
  return (
    <footer className="border-receipt-line mt-6 border-t border-dashed pt-4 text-center uppercase">
      <p className="text-receipt-ink text-[10px] font-bold tracking-wider">
        Dziękujemy za wspólne wydawanie
      </p>
      <p className="text-receipt-muted mt-1 text-[10px] font-semibold">
        Reklamacji nie przyjmujemy :)
      </p>
      <div className="mt-4 flex h-10 items-stretch justify-center gap-px">
        {BARCODE_PATTERN.map((width, index) => (
          <span
            key={index}
            className="bg-receipt-ink block"
            style={{ width: `${width * 1.35}px` }}
          />
        ))}
      </div>
      <p className="text-receipt-ink mt-1 text-[9px] tracking-[0.25em]">{tripIdShort}0001</p>
      <p className="text-receipt-stamp mt-4 rotate-[-1deg] text-[10px] font-black tracking-[0.18em]">
        *** Wyjezdnik pamięta ***
      </p>
    </footer>
  );
});
