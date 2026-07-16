// src/components/modules/auth/trip-creator/step-basics.tsx
import { CalendarIcon, MapPin } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { DateRangePicker } from "~/components/date-range-picker";
import type { TripFormData } from "./index";

interface Props {
  data: TripFormData;
  setData: React.Dispatch<React.SetStateAction<TripFormData>>;
  onNext: () => void;
  onCancel: () => void;
}

export function StepBasics({ data, setData, onNext, onCancel }: Props) {
  const isValid = data.name.trim().length >= 2;

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-theme-primary text-xs font-bold tracking-widest uppercase">
          Zacznij od najważniejszego
        </span>
        <h2 className="font-heading text-theme-text text-4xl leading-tight font-semibold">
          Dokąd jedziecie?
        </h2>
        <p className="text-theme-muted text-sm">
          Nazwa wystarczy, żeby utworzyć wyjazd. Resztę możesz pominąć i uzupełnić później.
        </p>
      </div>

      <Input
        label="Nazwa wyjazdu"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        placeholder="np. Majówka w Alpach"
        autoFocus
        className={{ input: "font-bold" }}
      />

      <section className="bg-theme-card/70 border-theme-border flex flex-col gap-3 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <div className="bg-theme-primary/10 text-theme-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <MapPin size={19} />
          </div>
          <div>
            <h3 className="text-theme-text font-bold">Miejsce docelowe</h3>
            <p className="text-theme-muted text-xs">Opcjonalne · zasili kafelek z nawigacją.</p>
          </div>
        </div>
        <Input
          label="Nazwa miejsca"
          value={data.destinationName}
          onChange={(event) => setData({ ...data, destinationName: event.target.value })}
          placeholder="np. Domek nad jeziorem"
        />
        <Input
          label="Adres"
          value={data.destinationAddress}
          onChange={(event) => setData({ ...data, destinationAddress: event.target.value })}
          placeholder="Ulica, miejscowość"
        />
        <Input
          type="url"
          label="Link do mapy (opcjonalnie)"
          value={data.destinationMapUrl}
          onChange={(event) => setData({ ...data, destinationMapUrl: event.target.value })}
          placeholder="https://maps.app.goo.gl/..."
        />
      </section>

      <section className="bg-theme-card/70 border-theme-border flex flex-col gap-3 rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-theme-accent/10 text-theme-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <CalendarIcon size={19} />
            </div>
            <div>
              <h3 className="text-theme-text font-bold">Termin</h3>
              <p className="text-theme-muted text-xs">
                Opcjonalny · możesz wybrać także jeden dzień.
              </p>
            </div>
          </div>
        </div>
        <DateRangePicker
          value={data.dateRange}
          onChange={(dateRange) => setData({ ...data, dateRange })}
        />
      </section>

      <div className="mt-4 flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="text-theme-muted border-theme-border flex-1 text-xs font-bold tracking-widest uppercase"
        >
          Anuluj
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 text-xs font-bold tracking-widest uppercase shadow-lg"
        >
          Dalej
        </Button>
      </div>
    </div>
  );
}
