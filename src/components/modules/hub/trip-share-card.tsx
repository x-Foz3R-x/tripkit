"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export function TripShareCard({ inviteToken, joinPin }: { inviteToken: string; joinPin: string }) {
  const [feedback, setFeedback] = useState<"link" | "pin" | null>(null);

  const showFeedback = (value: "link" | "pin") => {
    setFeedback(value);
    window.setTimeout(() => setFeedback(null), 1800);
  };

  const copyPin = async () => {
    await navigator.clipboard.writeText(joinPin);
    showFeedback("pin");
  };

  const shareInvite = async () => {
    const inviteUrl = `${window.location.origin}/join/${inviteToken}`;

    if (navigator.share) {
      await navigator.share({ title: "Dołącz do wyjazdu", url: inviteUrl });
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);
    showFeedback("link");
  };

  return (
    <section className="bg-theme-card border-theme-border flex flex-col gap-4 rounded-2xl border p-5 shadow-sm">
      <div>
        <p className="text-theme-primary text-xs font-bold tracking-wider uppercase">
          Zaproś ekipę
        </p>
        <p className="text-theme-muted mt-1 text-sm">Udostępnij link albo podaj 6-cyfrowy PIN.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => void copyPin()}
          className="border-theme-border bg-theme-bg/60 flex min-w-0 flex-1 items-center justify-between rounded-xl border px-4 py-3"
        >
          <span className="text-theme-text font-mono text-xl font-bold tracking-[0.25em]">
            {joinPin}
          </span>
          {feedback === "pin" ? (
            <Check size={17} className="text-theme-success" />
          ) : (
            <Copy size={17} className="text-theme-muted" />
          )}
        </button>

        <button
          type="button"
          onClick={() => void shareInvite()}
          className="bg-theme-primary text-theme-primary-foreground flex h-12 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold"
        >
          {feedback === "link" ? <Check size={17} /> : <Share2 size={17} />}
          Link
        </button>
      </div>
    </section>
  );
}
