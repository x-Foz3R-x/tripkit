import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { TripFormData } from "./index";

interface Props {
  data: TripFormData;
  setData: React.Dispatch<React.SetStateAction<TripFormData>>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepTeams({ data, setData, onBack, onSubmit, isSubmitting }: Props) {
  const [teamName, setTeamName] = useState("");
  const allUsers = [data.adminName, ...data.members];

  const addTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      setData({
        ...data,
        teams: [
          ...data.teams,
          { id: Date.now().toString(), name: teamName.trim(), color: "#3b82f6" },
        ],
      });
      setTeamName("");
    }
  };

  const assignUser = (user: string, teamId: string) => {
    setData({ ...data, memberAssignments: { ...data.memberAssignments, [user]: teamId } });
  };

  return (
    <>
      <div className="mb-4 text-center">
        <h2 className="font-heading text-2xl font-bold">Drużyny</h2>
      </div>

      <form onSubmit={addTeam} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Nazwa drużyny"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" className="h-10">
          +
        </Button>
      </form>

      {data.teams.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 border-t border-theme-border pt-4">
          <span className="text-theme-muted text-xs font-bold tracking-widest uppercase">
            Przypisz graczy
          </span>
          {allUsers.map((user) => (
            <div key={user} className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">{user}</span>
              <select
                value={data.memberAssignments[user] || ""}
                onChange={(e) => assignUser(user, e.target.value)}
                className="bg-theme-bg text-theme-text rounded-md border border-theme-border px-2 py-1 text-xs outline-none"
              >
                <option value="">Brak drużyny</option>
                {data.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Wróć
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Zapis..." : "Zakończ"}
        </Button>
      </div>
    </>
  );
}
