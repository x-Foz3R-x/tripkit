"use client";

import { Button } from "~/components/ui/button";

export default function TripError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-heading text-theme-text text-3xl font-semibold">
        Nie udało się wczytać wyjazdu
      </h1>
      <p className="text-theme-muted max-w-72 text-sm">
        Połączenie mogło zostać przerwane. Spróbuj ponownie — Twoja sesja pozostaje na urządzeniu.
      </p>
      <Button type="button" onClick={reset}>
        Spróbuj ponownie
      </Button>
    </div>
  );
}
