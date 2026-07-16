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
    try {
      await navigator.clipboard.writeText(joinPin);
      showFeedback("pin");
    } catch {
      // Schowek może być niedostępny bez zgody przeglądarki.
    }
  };

  const shareInvite = async () => {
    const inviteUrl = `${window.location.origin}/join/${inviteToken}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Dołącz do wyjazdu", url: inviteUrl });
        return;
      } catch (error) {
        if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      showFeedback("link");
    } catch {
      // Nie pokazujemy błędu aplikacji, gdy systemowe udostępnianie zostanie anulowane.
    }
  };

  return (
    <section className="bg-theme-card border-theme-border flex items-center justify-between gap-3 rounded-2xl border p-3">
      <div className="min-w-0 flex-1">
        <p className="text-theme-muted text-[10px] font-bold tracking-wider uppercase">
          Zaproszenie · PIN
        </p>
        <p className="text-theme-text mt-0.5 font-mono text-lg font-bold tracking-[0.2em]">
          {joinPin}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void copyPin()}
          className="border-theme-border text-theme-muted hover:text-theme-text flex h-11 w-11 items-center justify-center rounded-xl border"
          aria-label="Kopiuj PIN wyjazdu"
        >
          {feedback === "pin" ? (
            <Check size={17} className="text-theme-success" />
          ) : (
            <Copy size={17} className="text-theme-muted" />
          )}
        </button>

        <button
          type="button"
          onClick={() => void shareInvite()}
          className="bg-theme-primary text-theme-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl"
          aria-label="Udostępnij link zaproszenia"
        >
          {feedback === "link" ? <Check size={17} /> : <Share2 size={17} />}
        </button>
      </div>
    </section>
  );
}
