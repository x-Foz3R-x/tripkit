"use client";

import { forwardRef } from "react";
import { type HTMLMotionProps, motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

// Twoja piękna inżynieria z CVA, ale z dynamicznymi kolorami motywu!
export const ButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow hover:bg-primary/90",
        outline: "border border-white/20 bg-transparent hover:bg-card hover:text-text",
        secondary: "bg-card text-text hover:bg-card/80 border border-white/5",
        ghost: "hover:bg-card hover:text-text",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2 rounded-xl",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = HTMLMotionProps<"button"> & VariantProps<typeof ButtonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, whileTap = { scale: 0.95 }, disabled, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      className={cn(ButtonVariants({ variant, size, className }))}
      disabled={disabled}
      whileTap={disabled ? undefined : whileTap}
      {...props}
    >
      {children}
    </motion.button>
  );
});
