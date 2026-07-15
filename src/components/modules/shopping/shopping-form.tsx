"use client";

import { memo, useState } from "react";
import { Check, ShoppingCart, UsersRound } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { supabase } from "~/lib/supabase";
import type { Database } from "~/types/database";
import { useTripRoute } from "~/providers/trip-route-provider";

type User = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name">;

interface ShoppingFormProps {
  users: User[];
  activeUserId: string;
  onSuccess: () => void;
}

export const ShoppingForm = memo(function ShoppingForm({
  users,
  activeUserId,
  onSuccess,
}: ShoppingFormProps) {
  const { tripId } = useTripRoute();
  const [itemName, setItemName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forUsers, setForUsers] = useState<string[]>([]);
  const [isSpecificUsers, setIsSpecificUsers] = useState(false);

  const isFormValid = itemName.trim().length > 0;

  const toggleUser = (userId: string) => {
    setForUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;
    setIsLoading(true);

    const { error } = await supabase.from("shopping_list").insert({
      trip_id: tripId,
      added_by: activeUserId,
      item_name: itemName.trim(),
      for_users: isSpecificUsers ? forUsers : [],
    });

    setIsLoading(false);

    if (!error) {
      onSuccess();
    } else {
      console.error("Błąd zapisu na liście:", error);
    }
  };

  return (
    <div className="pb-safe font-body">
      <div className="border-theme-border mb-4 flex items-center gap-2 border-b border-dashed pb-4">
        <ShoppingCart size={18} className="text-theme-primary" />
        <span className="text-theme-text text-sm font-bold tracking-wider uppercase">
          Dodaj do koszyka
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          id="item-name"
          label="Co kupujemy?"
          value={itemName}
          placeholder="np. Woda niegazowana 6x1.5L"
          onChange={(e) => setItemName(e.target.value)}
          className={{
            input:
              "bg-theme-bg text-theme-text focus:border-theme-primary border-theme-border text-[16px]",
          }}
        />

        <div className="border-theme-border bg-theme-text/5 flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersRound size={15} className="text-theme-muted" />
              <span className="text-theme-muted text-xs font-bold tracking-wider uppercase">
                Dla kogo to jest?
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsSpecificUsers(false)}
              className={`flex-1 rounded-lg py-2 text-[11px] font-bold uppercase transition ${
                !isSpecificUsers
                  ? "bg-theme-primary/20 text-theme-primary border-theme-primary/30 border"
                  : "bg-theme-bg text-theme-muted border-theme-border border"
              }`}
            >
              Wspólne
            </button>
            <button
              type="button"
              onClick={() => setIsSpecificUsers(true)}
              className={`flex-1 rounded-lg py-2 text-[11px] font-bold uppercase transition ${
                isSpecificUsers
                  ? "bg-theme-primary/20 text-theme-primary border-theme-primary/30 border"
                  : "bg-theme-bg text-theme-muted border-theme-border border"
              }`}
            >
              Dla wybranych
            </button>
          </div>

          {isSpecificUsers && (
            <div className="border-theme-border mt-1 flex flex-wrap gap-1.5 border-t border-dashed pt-3">
              {users.map((user) => {
                const isSelected = forUsers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                      isSelected
                        ? "border-theme-primary bg-theme-primary/10 text-theme-primary"
                        : "bg-theme-bg text-theme-muted border-theme-border"
                    }`}
                  >
                    {isSelected && <Check size={11} />}
                    {user.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant={isFormValid ? "default" : "outline"}
          disabled={!isFormValid || isLoading}
          onClick={() => void handleSubmit()}
          className={`mt-2 w-full gap-2 text-[12px] font-bold tracking-wider uppercase ${
            isFormValid
              ? ""
              : "border-theme-primary/30 text-theme-muted border-dashed bg-transparent"
          }`}
        >
          <ShoppingCart size={16} />
          {isLoading ? "Zapisywanie..." : "Dorzuć do listy"}
        </Button>
      </div>
    </div>
  );
});
