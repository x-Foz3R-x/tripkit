// src/components/modules/auth/trip-creator/step-basics.tsx
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import type { TripFormData } from "./index";

interface Props {
  data: TripFormData;
  setData: React.Dispatch<React.SetStateAction<TripFormData>>;
  onNext: () => void;
  onCancel: () => void;
}

export function StepBasics({ data, setData, onNext, onCancel }: Props) {
  const isValid = data.name.trim().length > 0 && data.dateRange.from && data.dateRange.to;

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <div className="mb-2 text-center">
        <h2 className="font-heading text-theme-text text-2xl font-bold">Podstawy wyjazdu</h2>
      </div>

      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-theme-muted text-[10px] font-bold tracking-widest uppercase">
          Nazwa wyjazdu
        </label>
        <Input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="np. Majówka w Alpach"
          className={{
            input:
              "bg-theme-card text-theme-text focus:border-theme-primary border-theme-border font-bold",
          }}
        />
      </div>

      {/* POJEDYNCZY KALENDARZ - ZAZNACZANIE PRZEDZIAŁU */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-theme-muted text-[10px] font-bold tracking-widest uppercase">
          Termin wyjazdu
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`bg-theme-card border-theme-border h-13 justify-start rounded-xl text-left font-bold ${
                !data.dateRange.from ? "text-theme-muted/50" : "text-theme-text"
              }`}
            >
              <CalendarIcon className="text-theme-muted mr-3 h-5 w-5" />
              {data.dateRange.from ? (
                data.dateRange.to ? (
                  <>
                    {format(data.dateRange.from, "d MMM yyyy", { locale: pl })} -{" "}
                    {format(data.dateRange.to, "d MMM yyyy", { locale: pl })}
                  </>
                ) : (
                  format(data.dateRange.from, "d MMM yyyy", { locale: pl })
                )
              ) : (
                <span>Wybierz daty (od - do)</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-theme-bg border-theme-border w-auto p-0" align="center">
            <Calendar
              mode="range"
              selected={{ from: data.dateRange.from, to: data.dateRange.to }}
              onSelect={(range) =>
                setData({
                  ...data,
                  dateRange: { from: range?.from ?? undefined, to: range?.to ?? undefined },
                })
              }
              // initialFocus
              locale={pl}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>

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
