"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, UserRound } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { verifyParticipantAction, type TripFormState } from "~/app/actions/trips";
import { Button } from "~/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";

export type ParticipantOption = {
  id: string;
  name: string;
  avatarUrl: string | null;
  hasPin: boolean;
};

const INITIAL_TRIP_FORM_STATE: TripFormState = { error: null };

function ParticipantPinForm({
  participant,
  tripKey,
  onBack,
}: {
  participant: ParticipantOption;
  tripKey: string;
  onBack: () => void;
}) {
  const [pin, setPin] = useState("");
  const [state, formAction, isPending] = useActionState(
    verifyParticipantAction,
    INITIAL_TRIP_FORM_STATE,
  );

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
      <div className="text-theme-primary bg-theme-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
        <KeyRound size={28} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-theme-text text-3xl font-bold">
          Cześć, {participant.name}!
        </h1>
        <p className="text-theme-muted text-sm">
          {participant.hasPin
            ? "Podaj swój 4-cyfrowy PIN, aby wejść."
            : "Ustaw swój 4-cyfrowy PIN na tym urządzeniu."}
        </p>
      </div>

      <form action={formAction} className="flex w-full flex-col items-center gap-4">
        <input type="hidden" name="tripKey" value={tripKey} />
        <input type="hidden" name="userId" value={participant.id} />
        <InputOTP
          name="userPin"
          maxLength={4}
          pattern={REGEXP_ONLY_DIGITS}
          inputMode="numeric"
          value={pin}
          onChange={setPin}
        >
          <InputOTPGroup className="gap-3">
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="bg-theme-card border-theme-border text-theme-text h-14 w-12 rounded-xl border text-2xl font-bold sm:h-16 sm:w-14"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {state.error && <p className="text-theme-danger text-xs font-bold">{state.error}</p>}

        <Button
          type="submit"
          disabled={pin.length !== 4 || isPending}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2"
        >
          {isPending ? "Sprawdzanie..." : participant.hasPin ? "Wejdź" : "Ustaw PIN i wejdź"}
          {!isPending && <ArrowRight size={16} />}
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="text-theme-muted hover:text-theme-text flex items-center gap-2 text-xs font-bold uppercase"
      >
        <ArrowLeft size={14} /> To nie ja
      </button>
    </div>
  );
}

export function ParticipantPicker({
  participants,
  tripKey,
  tripName,
}: {
  participants: ParticipantOption[];
  tripKey: string;
  tripName: string;
}) {
  const [selected, setSelected] = useState<ParticipantOption | null>(null);

  if (selected) {
    return (
      <ParticipantPinForm
        key={selected.id}
        participant={selected}
        tripKey={tripKey}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-1">
        <span className="text-theme-muted text-[10px] font-bold tracking-widest uppercase">
          Dołączasz do
        </span>
        <h1 className="font-heading text-theme-text text-3xl font-bold">{tripName}</h1>
        <p className="text-theme-muted mt-2 text-sm">Wybierz siebie z listy uczestników.</p>
      </div>

      {participants.length === 0 ? (
        <div className="border-theme-border text-theme-muted w-full rounded-2xl border border-dashed p-8 text-sm">
          Ten wyjazd nie ma jeszcze uczestników.
        </div>
      ) : (
        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          {participants.map((participant) => (
            <button
              type="button"
              key={participant.id}
              onClick={() => setSelected(participant)}
              className="bg-theme-card border-theme-border hover:border-theme-primary/50 hover:bg-theme-primary/10 flex items-center gap-3 rounded-xl border p-3 text-left transition active:scale-95"
            >
              <div className="text-theme-muted bg-theme-text/5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <UserRound size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-theme-text block truncate text-sm font-bold">
                  {participant.name}
                </span>
                <span className="text-theme-muted mt-0.5 block text-[9px] tracking-widest uppercase">
                  {participant.hasPin ? "PIN ustawiony" : "Ustaw PIN"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
