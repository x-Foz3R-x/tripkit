// src/components/modules/auth/trip-creator/index.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "~/lib/supabase";
import { useTrip } from "~/providers/trip-provider";
import { StepBasics } from "./step-basics";
import { StepModules } from "./step-modules";
import { StepAdmin } from "./step-admin";
import { StepMembers } from "./step-members";
import { StepTeams } from "./step-teams";

export interface TripFormData {
  name: string;
  dateRange: { from: Date | undefined; to: Date | undefined }; // Jeden zgrabny obiekt na daty
  modules: {
    finances: boolean;
    shopping: boolean;
    scoreboard: boolean;
  };
  adminName: string;
  adminPin: string;
  members: string[];
  teams: { id: string; name: string; color: string }[];
  memberAssignments: Record<string, string>;
}

const INITIAL_DATA: TripFormData = {
  name: "",
  dateRange: { from: undefined, to: undefined },
  modules: { finances: true, shopping: true, scoreboard: false },
  adminName: "",
  adminPin: "",
  members: [],
  teams: [],
  memberAssignments: {},
};

export function TripCreator({ onCancel }: { onCancel: () => void }) {
  const { joinTrip } = useTrip();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TripFormData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = formData.modules.scoreboard ? 5 : 4;
  const progressPercent = (step / totalSteps) * 100;

  const generateJoinPin = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Formatujemy natywne obiekty Date na YYYY-MM-DD dla Supabase
      const start = formData.dateRange.from ? format(formData.dateRange.from, "yyyy-MM-dd") : null;
      const end = formData.dateRange.to ? format(formData.dateRange.to, "yyyy-MM-dd") : null;

      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert({
          name: formData.name,
          start_date: start,
          end_date: end,
          join_pin: generateJoinPin(),
          modules: formData.modules,
        })
        .select()
        .single();

      if (tripError || !tripData) throw new Error("Błąd tworzenia wyjazdu.");

      const teamIdMap: Record<string, string> = {};
      if (formData.modules.scoreboard && formData.teams.length > 0) {
        const teamsToInsert = formData.teams.map((t) => ({
          trip_id: tripData.id,
          name: t.name,
          color_hex: t.color,
        }));
        const { data: teamsData } = await supabase.from("teams").insert(teamsToInsert).select();

        teamsData?.forEach((dbTeam) => {
          const localTeam = formData.teams.find((lt) => lt.name === dbTeam.name);
          if (localTeam) teamIdMap[localTeam.id] = dbTeam.id;
        });
      }

      const { data: adminData } = await supabase
        .from("users")
        .insert({
          trip_id: tripData.id,
          name: formData.adminName,
          user_pin: formData.adminPin,
          is_admin: true,
          team_id: teamIdMap[formData.memberAssignments[formData.adminName]!] || null,
        })
        .select()
        .single();

      if (formData.members.length > 0) {
        const membersData = formData.members.map((name) => ({
          trip_id: tripData.id,
          name,
          is_admin: false,
          team_id: teamIdMap[formData.memberAssignments[name]!] || null,
        }));
        await supabase.from("users").insert(membersData);
      }

      joinTrip({ tripId: tripData.id, userId: adminData!.id });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  return (
    <div className="animate-fade-in flex min-h-[85vh] w-full flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex w-full flex-col gap-2">
          <div className="text-theme-muted flex justify-between text-[10px] font-bold tracking-widest uppercase">
            <span>
              Krok {step} z {totalSteps}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-theme-text/10">
            <div
              className="bg-theme-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <StepBasics data={formData} setData={setFormData} onNext={next} onCancel={onCancel} />
        )}
        {step === 2 && (
          <StepModules data={formData} setData={setFormData} onNext={next} onBack={back} />
        )}
        {step === 3 && (
          <StepAdmin data={formData} setData={setFormData} onNext={next} onBack={back} />
        )}
        {step === 4 && (
          <StepMembers
            data={formData}
            setData={setFormData}
            onBack={back}
            onNext={formData.modules.scoreboard ? next : handleSubmit}
            isSubmitting={isLoading && !formData.modules.scoreboard}
          />
        )}
        {step === 5 && formData.modules.scoreboard && (
          <StepTeams
            data={formData}
            setData={setFormData}
            onBack={back}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
          />
        )}
      </div>
    </div>
  );
}
