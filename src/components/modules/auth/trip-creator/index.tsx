// src/components/modules/auth/trip-creator/index.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createTripAction } from "~/app/actions/trips";
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
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TripFormData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = formData.modules.scoreboard ? 5 : 4;
  const progressPercent = (step / totalSteps) * 100;

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      // Formatujemy natywne obiekty Date na YYYY-MM-DD dla Supabase
      const start = formData.dateRange.from ? format(formData.dateRange.from, "yyyy-MM-dd") : null;
      const end = formData.dateRange.to ? format(formData.dateRange.to, "yyyy-MM-dd") : null;

      const result = await createTripAction({
        name: formData.name,
        startDate: start,
        endDate: end,
        modules: formData.modules,
        adminName: formData.adminName,
        adminPin: formData.adminPin,
        members: formData.members,
        teams: formData.teams,
        memberAssignments: formData.memberAssignments,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        setIsLoading(false);
        return;
      }

      router.replace(`/t/${result.urlKey}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      setSubmitError("Nie udało się utworzyć wyjazdu.");
      setIsLoading(false);
    }
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  return (
    <div className="animate-fade-in flex min-h-[85vh] w-full flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {submitError && (
          <div className="border-theme-danger/30 bg-theme-danger/10 text-theme-danger rounded-xl border px-4 py-3 text-center text-sm font-bold">
            {submitError}
          </div>
        )}
        <div className="flex w-full flex-col gap-2">
          <div className="text-theme-muted flex justify-between text-[10px] font-bold tracking-widest uppercase">
            <span>
              Krok {step} z {totalSteps}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="bg-theme-text/10 h-1.5 w-full overflow-hidden rounded-full">
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
