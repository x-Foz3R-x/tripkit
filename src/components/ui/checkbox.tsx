// src/components/ui/checkbox.tsx
"use client";

import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ id, checked, onChange, label }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-start gap-3 py-2 transition-all active:scale-[0.98]"
    >
      <div className="relative mt-0.5 flex shrink-0 items-center justify-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only" // sr-only ukrywa domyślny kwadrat, ale zostawia go dla czytników ekranu
        />
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200 ease-in-out",
            checked
              ? "border-theme-primary bg-theme-primary"
              : "bg-theme-bg group-hover:border-theme-primary/50 border-white/20",
          )}
        >
          <Check
            size={14}
            strokeWidth={3}
            className={cn(
              "text-white transition-transform duration-200",
              checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </div>
      </div>
      <span
        className={cn(
          "font-body text-[15px] transition-colors duration-200 select-none",
          checked ? "text-theme-muted line-through" : "text-theme-text",
        )}
      >
        {label}
      </span>
    </label>
  );
}
