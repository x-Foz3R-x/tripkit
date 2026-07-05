/* eslint-disable @next/next/no-img-element */
"use client";

import { memo } from "react";

interface ReceiptFooterProps {
  tripIdShort: string;
}

const BARCODE_PATTERN = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 1, 4, 2, 1, 1, 3, 2, 1, 4, 1, 2, 1, 1, 3, 2, 1, 1, 2,
];

export const ReceiptFooter = memo(function ReceiptFooter({ tripIdShort }: ReceiptFooterProps) {
  return (
    <>
      <div className="mt-6 flex flex-col gap-1 border-t border-dashed border-white/20 pt-5 text-center text-[13px] leading-none font-bold">
        <span className="text-theme-primary mx-auto mb-1 block w-fit rounded bg-white/10 px-2 py-1">
          GWARANCJA
        </span>

        <span className="tracking-tight text-white/90 uppercase">W naszym Skarbcu</span>

        <span className="tracking-tight text-white/90 uppercase">nie zgubimy</span>

        <span className="mt-1 text-[17px] tracking-widest text-white uppercase">
          żadnej złotówki
        </span>

        <span className="border-theme-primary text-theme-primary mx-auto mt-4 inline-block border-b pb-1 text-[15px] uppercase">
          Skarbiec pamięta
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1">
        <div className="flex h-10 w-full items-center justify-center gap-0.5 opacity-70">
          {BARCODE_PATTERN.map((width, index) => (
            <div key={index} className="h-full bg-white/80" style={{ width: `${width * 1.5}px` }} />
          ))}
        </div>

        <span className="text-theme-muted mt-1 text-[10px] tracking-widest">
          Nr wpisu: {tripIdShort}
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center border-t border-white/10 pt-4">
        <span className="text-theme-muted/70 mb-2 text-[10px] font-bold tracking-widest uppercase">
          Odbierz rabat na 10 PLN
        </span>

        <div className="rounded-xl bg-white p-2">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://www.youtube.com/watch?v=dQw4w9WgXcQ&margin=0"
            alt="Easter Egg QR"
            className="h-20 w-20"
            width={80}
            height={80}
            loading="lazy"
          />
        </div>
      </div>
    </>
  );
});
