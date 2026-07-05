"use client";

import { memo, useEffect, useState } from "react";
import { Check, ChevronDown, ReceiptText, UserRound, UsersRound } from "lucide-react";
import { Button } from "~/components/ui/button";
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

export const ExpenseForm = memo(function ExpenseForm({
  users,
  activeUserId,
  onSuccess,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [payerId, setPayerId] = useState(activeUserId);
  const [splitAmong, setSplitAmong] = useState<string[]>(users.map((user) => user.id));

  useEffect(() => {
    setSplitAmong((previous) => (previous.includes(payerId) ? previous : [...previous, payerId]));
  }, [payerId]);

  const otherParticipants = splitAmong.filter((id) => id !== payerId);

  const parsedAmount = Number(amount);
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const isFormValid =
    description.trim().length > 0 && isAmountValid && otherParticipants.length > 0;

  const toggleUser = (userId: string) => {
    if (userId === payerId) return;

    setSplitAmong((previous) =>
      previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId],
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    const { error } = await supabase.from("expenses").insert({
      trip_id: env.NEXT_PUBLIC_TRIP_ID,
      user_id: payerId,
      amount: parsedAmount,
      description: description.trim(),
      split_among: splitAmong,
    });

    setIsLoading(false);

    if (!error) {
      onSuccess();
    } else {
      console.error("Błąd zapisu wydatku:", error);
    }
  };

  const isSubmitDisabled = isLoading || !isFormValid;

  return (
    <div className="pb-safe font-mono">
      <div className="mb-3 flex items-center justify-between border-b border-dashed border-white/15 pb-3">
        <div className="flex items-center gap-2">
          <ReceiptText size={17} className="text-theme-primary" />

          <span className="text-[12px] font-bold tracking-[0.13em] text-white uppercase">
            Dopisz pozycję
          </span>
        </div>

        <span className="text-theme-muted rounded-md border border-white/10 px-2 py-1 text-[9px] tracking-wider uppercase">
          PLN
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="expense-payer"
            className="text-theme-muted flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] uppercase"
          >
            <UserRound size={14} className="text-theme-primary" />
            Płatnik
          </label>

          <div className="relative">
            <select
              id="expense-payer"
              value={payerId}
              onChange={(event) => setPayerId(event.target.value)}
              className="bg-theme-bg text-theme-text focus:border-theme-primary h-11 w-full appearance-none rounded-xl border border-white/10 px-4 pr-11 text-sm transition-colors outline-none"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                  {user.id === activeUserId ? " (Ty)" : ""}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="text-theme-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
            />
          </div>
        </div>

        <div className="border-t border-dashed border-white/10 pt-3">
          <Input
            id="expense-description"
            label="Nazwa pozycji"
            value={description}
            placeholder="np. Zakupy w Żabce"
            onChange={(event) => setDescription(event.target.value)}
            className={{
              input:
                "bg-theme-bg text-theme-text placeholder:text-theme-muted/45 focus:border-theme-primary border-white/10 font-mono text-sm",
              label: "font-mono text-sm",
            }}
          />
        </div>

        <div className="relative">
          <Input
            id="expense-amount"
            label="Kwota"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            value={amount ?? ""}
            placeholder="0.00"
            onChange={(event) =>
              setAmount(event.target.value === "" ? null : Number(event.target.value))
            }
            className={{
              input:
                "bg-theme-bg text-theme-text placeholder:text-theme-muted/45 focus:border-theme-primary border-white/10 pr-16 font-mono text-base font-bold",
              label: "font-mono text-sm",
            }}
          />

          <span className="text-theme-primary pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[11px] font-bold">
            PLN
          </span>
        </div>

        <div className="border-t border-dashed border-white/10 pt-3">
          <div className="flex items-center gap-2">
            <UsersRound size={15} className="text-theme-primary" />

            <p className="text-theme-muted text-[10px] font-bold tracking-[0.14em] uppercase">
              Podział kosztu
            </p>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {users.map((user) => {
              const isPayer = user.id === payerId;
              const isSelected = splitAmong.includes(user.id);

              if (isPayer) {
                return (
                  <span
                    key={user.id}
                    className="border-theme-primary/30 bg-theme-primary/10 text-theme-primary flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-bold"
                  >
                    <Check size={11} />
                    {user.name}
                    <span className="opacity-60">(płaci)</span>
                  </span>
                );
              }

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  aria-pressed={isSelected}
                  className={`focus-visible:ring-theme-primary focus-visible:ring-offset-theme-bg flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 ${
                    isSelected
                      ? "border-theme-primary bg-theme-primary/10 text-theme-primary"
                      : "bg-theme-bg text-theme-muted hover:text-theme-text border-white/10 hover:border-white/30"
                  }`}
                >
                  {isSelected && <Check size={11} />}
                  {user.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-dashed border-white/15 pt-3">
          <Button
            type="button"
            variant={isFormValid ? "default" : "outline"}
            disabled={isSubmitDisabled}
            onClick={() => void handleSubmit()}
            className={`w-full gap-2 font-mono text-[12px] font-bold tracking-[0.13em] uppercase ${
              isFormValid
                ? "shadow-lg"
                : "border-theme-primary/35 text-theme-muted border-dashed bg-transparent shadow-none"
            }`}
          >
            <ReceiptText size={16} />
            {isLoading ? "Zapisywanie..." : "Zapisz pozycję"}
          </Button>
        </div>
      </div>
    </div>
  );
});
