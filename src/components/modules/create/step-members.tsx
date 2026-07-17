import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { TripFormData } from "./index";

interface Props {
  data: TripFormData;
  setData: React.Dispatch<React.SetStateAction<TripFormData>>;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function StepMembers({ data, setData, onNext, onBack, isSubmitting }: Props) {
  const [newMember, setNewMember] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMember.trim();
    if (name && !data.members.includes(name) && name !== data.adminName) {
      setData({ ...data, members: [...data.members, name] });
      setNewMember("");
    }
  };

  const remove = (name: string) => {
    setData({ ...data, members: data.members.filter((m) => m !== name) });
  };

  return (
    <>
      <div className="mb-4 text-center">
        <h2 className="font-heading text-2xl font-bold">Kto jedzie?</h2>
      </div>

      <form onSubmit={add} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Dodaj osobę"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" className="h-10">
          +
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="bg-theme-primary/20 text-theme-primary rounded-md px-3 py-1.5 text-xs font-bold">
          {data.adminName} (Ty)
        </span>
        {data.members.map((m) => (
          <span
            key={m}
            onClick={() => remove(m)}
            className="bg-theme-card border-theme-border hover:border-theme-danger cursor-pointer rounded-md border px-3 py-1.5 text-xs font-bold"
          >
            {m} &times;
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Wróć
        </Button>
        <Button onClick={onNext} disabled={isSubmitting} className="flex-1">
          {data.modules.scoreboard ? "Dalej: drużyny" : "Dalej"}
        </Button>
      </div>
    </>
  );
}
