// src/components/modules/finances/expense-form.tsx
"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "~/components/ui/input";
import { supabase } from "~/lib/supabase";
import { env } from "~/env";
import type { Database } from "~/types/database";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

interface ExpenseFormProps {
  users: User[];
  activeUserId: string;
  onSuccess: () => void;
}

export function ExpenseForm({ users, activeUserId, onSuccess }: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [payerId, setPayerId] = useState<string>(activeUserId);
  const [splitAmong, setSplitAmong] = useState<string[]>(users.map((u) => u.id));

  useEffect(() => {
    setSplitAmong((prev) => (prev.includes(payerId) ? prev : [...prev, payerId]));
  }, [payerId]);

  const otherParticipants = splitAmong.filter((id) => id !== payerId);

  const parsedAmount = Number(amount);
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const isFormValid =
    description.trim().length > 0 && isAmountValid && otherParticipants.length > 0;

  const toggleUser = (userId: string) => {
    if (userId === payerId) return;
    setSplitAmong((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsLoading(true);

    const { error } = await supabase.from("expenses").insert({
      trip_id: env.NEXT_PUBLIC_TRIP_ID,
      user_id: payerId,
      amount: parsedAmount,
      description: description.trim(),
      split_among: splitAmong,
    });

    setIsLoading(false);
    if (!error) onSuccess();
    else console.error("Błąd zapisu wydatku:", error);
  };

  return (
    <div className="pb-safe flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-theme-text font-body text-sm font-medium">Kto zapłacił?</label>
        <div className="relative">
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="bg-theme-bg font-body text-theme-text focus:border-theme-primary w-full appearance-none rounded-xl border border-white/10 px-4 py-3 transition-all outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.id === activeUserId ? "(Ty)" : ""}
              </option>
            ))}
          </select>
          <div className="text-theme-muted pointer-events-none absolute inset-y-0 right-4 flex items-center">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      <Input
        label="Za co (Zakupy, Paliwo, etc...)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="relative">
        <Input
          label="Kwota"
          type="number"
          step="0.01"
          min="0.01"
          value={amount ?? ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          className={{ input: "pr-12 font-mono text-lg" }}
        />
        <span className="text-theme-muted absolute top-1/2 right-4 -translate-y-1/2 font-mono">
          zł
        </span>
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <p className="font-body text-theme-text text-sm font-medium">Na kogo dzielimy?</p>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => {
            if (u.id === payerId) return null;
            const isSelected = splitAmong.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggleUser(u.id)}
                aria-pressed={isSelected}
                className={`focus-visible:ring-theme-primary focus-visible:ring-offset-theme-bg flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 ${
                  isSelected
                    ? "border-theme-primary bg-theme-primary/10 text-theme-primary"
                    : "bg-theme-bg text-theme-muted border-white/10 hover:border-white/30"
                }`}
              >
                {isSelected && <Check size={12} />}
                {u.name}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => void handleSubmit()}
        disabled={isLoading || !isFormValid}
        className="bg-theme-primary font-body hover:bg-theme-primary/90 mt-4 w-full rounded-xl py-3.5 text-[17px] font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
      >
        {isLoading ? "Przetwarzanie..." : "Wrzuć do Kociołka"}
      </button>
    </div>
  );
}
