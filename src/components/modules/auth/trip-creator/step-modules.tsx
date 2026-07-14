import { Button } from "~/components/ui/button";
import type { TripFormData } from "./index";

interface Props {
  data: TripFormData;
  setData: React.Dispatch<React.SetStateAction<TripFormData>>;
  onNext: () => void;
  onBack: () => void;
}

export function StepModules({ data, setData, onNext, onBack }: Props) {
  const toggle = (key: keyof TripFormData["modules"]) => {
    setData({ ...data, modules: { ...data.modules, [key]: !data.modules[key] } });
  };

  return (
    <>
      <div className="mb-4 text-center">
        <h2 className="font-heading text-2xl font-bold">Moduły</h2>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant={data.modules.finances ? "default" : "outline"}
          onClick={() => toggle("finances")}
        >
          💰 Finanse i Rozliczenia
        </Button>
        <Button
          variant={data.modules.shopping ? "default" : "outline"}
          onClick={() => toggle("shopping")}
        >
          🛒 Lista Zakupów
        </Button>
        <Button
          variant={data.modules.scoreboard ? "default" : "outline"}
          onClick={() => toggle("scoreboard")}
        >
          🏆 Drużyny i Scoreboard
        </Button>
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Wróć
        </Button>
        <Button onClick={onNext} className="flex-1">
          Dalej
        </Button>
      </div>
    </>
  );
}
