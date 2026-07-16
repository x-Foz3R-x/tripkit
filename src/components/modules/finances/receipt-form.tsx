"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Equal, ReceiptText, UserRound, UsersRound } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Database } from "~/types/database";
import { useTripRoute } from "~/providers/trip-route-provider";
import { createExpenseAction } from "~/app/actions/finances";
import { formatFinanceAmount, getFinanceModeLabel } from "~/lib/finances";
import { cn } from "~/lib/utils";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;
type SplitMode = "equal" | "manual";

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
  const { urlKey, financeMode } = useTripRoute();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [payerId, setPayerId] = useState(activeUserId);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [splitAmong, setSplitAmong] = useState<string[]>(users.map((user) => user.id));
  const [manualShares, setManualShares] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSplitAmong((previous) => (previous.includes(payerId) ? previous : [...previous, payerId]));
    setManualShares((previous) => {
      if (!(payerId in previous)) return previous;
      const next = { ...previous };
      delete next[payerId];
      return next;
    });
  }, [payerId]);

  const parsedAmount = Number(amount);
  const isAmountValid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    (financeMode !== "whole" || Number.isInteger(parsedAmount));
  const equalParticipants = splitAmong.filter((id) => id !== payerId);
  const parsedManualShares = useMemo(
    () =>
      users
        .filter((user) => user.id !== payerId)
        .map((user) => ({
          userId: user.id,
          amount: Number(manualShares[user.id] ?? 0),
        }))
        .filter((share) => Number.isFinite(share.amount) && share.amount > 0),
    [manualShares, payerId, users],
  );
  const manualTotal = parsedManualShares.reduce((sum, share) => sum + share.amount, 0);
  const payerPart = isAmountValid ? parsedAmount - manualTotal : 0;
  const areManualSharesValid =
    parsedManualShares.length > 0 &&
    manualTotal <= parsedAmount &&
    parsedManualShares.every((share) => financeMode !== "whole" || Number.isInteger(share.amount));
  const isSplitValid = splitMode === "equal" ? equalParticipants.length > 0 : areManualSharesValid;
  const isFormValid = description.trim().length > 0 && isAmountValid && isSplitValid;

  const toggleUser = (userId: string) => {
    if (userId === payerId) return;
    setSplitAmong((previous) =>
      previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId],
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    const shares = splitMode === "manual" ? parsedManualShares : [];
    const participants =
      splitMode === "manual" ? [payerId, ...shares.map((share) => share.userId)] : splitAmong;

    const result = await createExpenseAction({
      tripKey: urlKey,
      payerId,
      amount: parsedAmount,
      description: description.trim(),
      splitAmong: participants,
      shares,
    });

    setIsLoading(false);
    if (result.ok) onSuccess();
    else setErrorMessage(result.error);
  };

  return (
    <div className="pb-safe font-mono">
      <div className="border-theme-border mb-4 flex items-center justify-between border-b border-dashed pb-3">
        <span className="text-theme-text flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <ReceiptText size={17} className="text-theme-primary" />
          Nowy wydatek
        </span>
        <span className="text-theme-muted text-[10px]">{getFinanceModeLabel(financeMode)}</span>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-theme-muted flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
            <UserRound size={14} className="text-theme-primary" />
            Kto zapłacił
          </span>
          <span className="relative">
            <select
              value={payerId}
              onChange={(event) => setPayerId(event.target.value)}
              className="bg-theme-bg text-theme-text focus:border-theme-primary border-theme-border h-12 w-full appearance-none rounded-xl border px-4 pr-11 text-sm outline-hidden"
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
          </span>
          <span className="text-theme-muted text-[10px]">
            Możesz wpisać rachunek za osobę, która właśnie prowadzi albo nie ma telefonu pod ręką.
          </span>
        </label>

        {errorMessage && (
          <p className="border-theme-danger/30 bg-theme-danger/8 text-theme-danger rounded-xl border px-3 py-2 font-sans text-xs">
            {errorMessage}
          </p>
        )}

        <Input
          label="Za co?"
          value={description}
          placeholder="np. Zakupy w Żabce"
          onChange={(event) => setDescription(event.target.value)}
          className={{
            input:
              "bg-theme-bg text-theme-text placeholder:text-theme-muted/45 focus:border-theme-primary border-theme-border font-mono",
            label: "font-mono",
          }}
        />

        <div>
          <div className="relative">
            <Input
              label="Kwota rachunku"
              type="number"
              step={financeMode === "whole" ? "1" : "0.01"}
              min={financeMode === "whole" ? "1" : "0.01"}
              inputMode={financeMode === "whole" ? "numeric" : "decimal"}
              value={amount ?? ""}
              placeholder={financeMode === "whole" ? "0" : "0,00"}
              onChange={(event) =>
                setAmount(event.target.value === "" ? null : Number(event.target.value))
              }
              className={{
                input:
                  "bg-theme-bg text-theme-text placeholder:text-theme-muted/45 focus:border-theme-primary border-theme-border pr-16 font-mono font-bold",
                label: "font-mono",
              }}
            />
            <span className="text-theme-primary pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs font-bold">
              PLN
            </span>
          </div>
          {financeMode === "whole" && (
            <p className="text-theme-muted mt-1 text-[10px]">
              Ten wyjazd używa wyłącznie pełnych złotych.
            </p>
          )}
        </div>

        <section className="border-theme-border border-t border-dashed pt-4">
          <div className="flex items-center gap-2">
            <UsersRound size={15} className="text-theme-primary" />
            <p className="text-theme-muted text-[10px] font-bold tracking-widest uppercase">
              Jak podzielić
            </p>
          </div>

          <div className="bg-theme-bg border-theme-border mt-3 grid grid-cols-2 rounded-xl border p-1">
            <SplitModeButton
              active={splitMode === "equal"}
              icon={Equal}
              label="Po równo"
              onClick={() => setSplitMode("equal")}
            />
            <SplitModeButton
              active={splitMode === "manual"}
              icon={ReceiptText}
              label="Własne kwoty"
              onClick={() => setSplitMode("manual")}
            />
          </div>

          {splitMode === "equal" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {users.map((user) => {
                const isPayer = user.id === payerId;
                const isSelected = splitAmong.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={isPayer}
                    onClick={() => toggleUser(user.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "border-theme-border text-theme-muted min-h-10 rounded-full border px-3 text-xs font-bold transition",
                      isSelected && "border-theme-primary bg-theme-primary/10 text-theme-primary",
                      isPayer && "cursor-default opacity-70",
                    )}
                  >
                    {isSelected && <Check className="mr-1 inline" size={12} />}
                    {user.name}
                    {isPayer && " · płatnik"}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-theme-muted mb-2 text-[10px] leading-relaxed">
                Wpisz tylko kwoty, które konkretne osoby mają oddać. To, co zostanie z rachunku,
                pozostaje po stronie płatnika.
              </p>
              <div className="border-theme-border divide-theme-border divide-y overflow-hidden rounded-xl border">
                {users
                  .filter((user) => user.id !== payerId)
                  .map((user) => (
                    <label key={user.id} className="flex min-h-13 items-center gap-3 px-3">
                      <span className="text-theme-text min-w-0 flex-1 truncate text-sm font-bold">
                        {user.name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step={financeMode === "whole" ? "1" : "0.01"}
                        inputMode={financeMode === "whole" ? "numeric" : "decimal"}
                        value={manualShares[user.id] ?? ""}
                        placeholder="0"
                        onChange={(event) =>
                          setManualShares((current) => ({
                            ...current,
                            [user.id]: event.target.value,
                          }))
                        }
                        className="text-theme-text placeholder:text-theme-muted/40 h-10 w-24 bg-transparent text-right font-mono font-bold outline-hidden"
                      />
                      <span className="text-theme-muted text-xs">zł</span>
                    </label>
                  ))}
              </div>

              {isAmountValid && (
                <div
                  className={cn(
                    "mt-3 flex items-center justify-between text-xs",
                    payerPart < 0 ? "text-theme-danger" : "text-theme-muted",
                  )}
                >
                  <span>Zostaje po stronie płatnika</span>
                  <strong>
                    {formatFinanceAmount(payerPart, financeMode, {
                      currency: true,
                    })}
                  </strong>
                </div>
              )}
            </div>
          )}
        </section>

        <Button
          type="button"
          variant={isFormValid ? "default" : "outline"}
          disabled={isLoading || !isFormValid}
          onClick={() => void handleSubmit()}
          className="w-full gap-2 font-mono text-xs font-bold tracking-widest uppercase"
        >
          <ReceiptText size={16} />
          {isLoading ? "Zapisywanie…" : "Dopisz do paragonu"}
        </Button>
      </div>
    </div>
  );
});

function SplitModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Equal;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-theme-muted flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-bold",
        active && "bg-theme-card-raised text-theme-text",
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
