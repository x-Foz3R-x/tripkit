import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
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
    <>
      <div className="mb-4 text-center">
        <h2 className="font-heading text-2xl font-bold">Główny Organizator</h2>
      </div>

      <Input
        label="Twoje Imię"
        value={data.adminName}
        onChange={(e) => setData({ ...data, adminName: e.target.value })}
      />

      <div className="flex flex-col items-center gap-2 border-t border-theme-border pt-4">
        <span className="text-theme-muted text-xs tracking-widest uppercase">
          Twój 4-cyfrowy PIN
        </span>
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
                className="bg-theme-card h-14 w-12 border-theme-border text-xl font-bold"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Wróć
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">
          Dalej
        </Button>
      </div>
    </>
  );
}
