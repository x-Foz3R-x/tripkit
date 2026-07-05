"use client";

import { forwardRef, useId, useState } from "react";
import { type HTMLMotionProps, motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const InputVariants = cva(
  "peer w-full appearance-none bg-transparent text-text outline-none placeholder:text-muted focus:outline-none disabled:pointer-events-none disabled:opacity-50 transition-shadow",
  {
    variants: {
      variant: {
        default: "border border-white/10 bg-card focus:border-primary",
        insetLabel: "border border-white/10 bg-card pb-1 pt-5 focus:border-primary shadow-sm",
      },
      size: {
        default: "rounded-xl px-4 h-12 text-base",
        sm: "rounded-lg px-3 h-10 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type HTMLInputProps = Omit<HTMLMotionProps<"input">, "size" | "className">;

export type InputProps = HTMLInputProps &
  VariantProps<typeof InputVariants> & {
    label?: string;
    className?: { container?: string; input?: string; label?: string };
  };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, variant, size, label, id, value, defaultValue, onChange, ...props },
  ref,
) {
  const uniqueId = useId();
  const inputId = id ?? uniqueId;
  const autoVariant = label ? "insetLabel" : variant;

  // Do obsługi pływającego labela potrzebujemy wiedzieć, czy jest jakaś wartość
  const [hasValue, setHasValue] = useState(!!value || !!defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    if (onChange) onChange(e);
  };

  return (
    <div className={cn("relative w-full focus-within:z-30", className?.container)}>
      <motion.input
        ref={ref}
        id={inputId}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={cn(InputVariants({ variant: autoVariant, size }), className?.input)}
        {...props}
      />

      {!!label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-muted peer-focus:text-primary pointer-events-none absolute inset-0 flex origin-top-left items-center overflow-hidden px-4 text-base duration-150 ease-in-out select-none peer-focus:translate-x-0.5 peer-focus:-translate-y-1.5 peer-focus:scale-[0.75]",
            hasValue && "text-muted translate-x-0.5 -translate-y-1.5 scale-[0.75]",
            className?.label,
          )}
        >
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
        </label>
      )}
    </div>
  );
});
