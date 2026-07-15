"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { joinTripByPinAction, type TripFormState } from "~/app/actions/trips";
import { Button } from "~/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";

interface StartScreenProps {
  initialError?: string | null;
  onCreateNew: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-invite": "Link zaproszenia jest nieprawidłowy albo wygasł.",
  "access-required": "Dołącz do wyjazdu PIN-em lub skorzystaj z linku zaproszenia.",
  "session-config": "Sesje urządzeń nie są jeszcze skonfigurowane na serwerze.",
  database: "Nie udało się połączyć z bazą wyjazdów. Spróbuj ponownie.",
};

const INITIAL_TRIP_FORM_STATE: TripFormState = { error: null };

export function StartScreen({ initialError, onCreateNew }: StartScreenProps) {
  const [tripPin, setTripPin] = useState("");
  const [state, formAction, isPending] = useActionState(
    joinTripByPinAction,
    INITIAL_TRIP_FORM_STATE,
  );
  const message = state.error ?? (initialError ? ERROR_MESSAGES[initialError] : null);

  return (
    <div className="animate-fade-in flex min-h-[85vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="text-theme-primary bg-theme-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm">
          <Image src="/favicon.png" alt="Logo Wyjezdnika" width={100} height={100} priority />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-theme-text text-4xl font-bold">Wyjezdnik</h1>
          <p className="text-theme-muted font-body px-4 text-sm">
            Wpisz 6-cyfrowy PIN wyjazdu albo skorzystaj z otrzymanego linku.
          </p>
        </div>

        <form action={formAction} className="flex w-full flex-col items-center gap-4">
          <InputOTP
            name="joinPin"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            value={tripPin}
            onChange={setTripPin}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="bg-theme-card border-theme-border text-theme-text h-12 w-10 rounded-lg border text-lg font-bold sm:h-14 sm:w-12"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {message && <p className="text-theme-danger text-xs font-bold">{message}</p>}

          <Button
            type="submit"
            disabled={tripPin.length !== 6 || isPending}
            className="mt-4 h-12 w-full text-xs font-bold tracking-widest uppercase shadow-lg"
          >
            {isPending ? "Sprawdzanie..." : "Dołącz do wyjazdu"}
          </Button>
        </form>

        <button
          type="button"
          onClick={onCreateNew}
          className="text-theme-muted hover:text-theme-text mt-4 text-[11px] font-bold tracking-widest uppercase underline decoration-dashed underline-offset-4 transition-colors"
        >
          Stwórz nowy wyjazd
        </button>
      </div>
    </div>
  );
}
