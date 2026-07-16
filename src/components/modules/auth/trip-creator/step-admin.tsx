import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { KeyRound, ShieldCheck } from "lucide-react";
import type { TripFormData } from "./index";

interface Props {
  data: TripFormData;
  setData: React.Dispatch<React.SetStateAction<TripFormData>>;
  onNext: () => void;
  onBack: () => void;
}

export function StepAdmin({ data, setData, onNext, onBack }: Props) {
  const isValid = data.adminName.trim().length > 0 && data.adminPin.length === 4;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-theme-primary text-xs font-bold tracking-widest uppercase">
          Twój profil
        </span>
        <h2 className="font-heading text-theme-text text-4xl leading-tight font-semibold">
          Kto organizuje wyjazd?
        </h2>
        <p className="text-theme-muted text-sm">
          Dostaniesz uprawnienia do edycji wyjazdu i podglądu PIN-ów uczestników.
        </p>
      </div>

      <Input
        label="Twoje Imię"
        value={data.adminName}
        onChange={(e) => setData({ ...data, adminName: e.target.value })}
      />

      <div className="bg-theme-card/70 border-theme-border flex flex-col items-center gap-4 rounded-2xl border p-5">
        <div className="flex w-full items-start gap-3">
          <div className="bg-theme-primary/10 text-theme-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <KeyRound size={19} />
          </div>
          <div>
            <span className="text-theme-text text-sm font-bold">Twój 4-cyfrowy PIN</span>
            <p className="text-theme-muted text-xs">Prosta blokada przed wejściem na zły profil.</p>
          </div>
        </div>
        <InputOTP
          maxLength={4}
          pattern={REGEXP_ONLY_DIGITS}
          value={data.adminPin}
          onChange={(val) => setData({ ...data, adminPin: val })}
        >
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="bg-theme-card border-theme-border h-14 w-12 text-xl font-bold"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="text-theme-muted flex items-center gap-1.5 text-[11px]">
          <ShieldCheck size={14} /> Administratorzy będą mogli go później przypomnieć.
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Wróć
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">
          Dalej
        </Button>
      </div>
    </div>
  );
}
