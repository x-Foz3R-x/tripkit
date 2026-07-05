// src/components/ui/link.tsx
import NextLink from "next/link";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

export const linkVariants = cva(
  "group relative inline-flex w-fit select-none items-center justify-center whitespace-nowrap transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-theme-primary text-white hover:bg-theme-primary/90 shadow-sm",
        outline: "border border-white/10 text-theme-text hover:bg-white/5",
        unset: "",
      },
      size: {
        base: "px-4 py-2 text-base rounded-xl",
        lg: "px-5 py-3 text-lg rounded-2xl",
        unset: "",
      },
    },
    defaultVariants: {
      variant: "unset",
      size: "unset",
    },
  },
);

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof linkVariants> & {
    href: string;
    children?: React.ReactNode;
  };

export const Link = {
  Default(props: LinkProps) {
    const { href, className, variant, size, ...otherProps } = props;
    return (
      <NextLink
        href={href}
        className={cn(linkVariants({ variant, size, className }))}
        {...otherProps}
      >
        {props.children}
      </NextLink>
    );
  },

  Arrow(props: LinkProps) {
    const { href, className, variant, size, ...otherProps } = props;
    return (
      <NextLink
        href={href}
        // Dodajemy gap i padding, żeby strzałka ładnie się układała
        className={cn(linkVariants({ variant, size, className }), "gap-2 pr-3 pl-4")}
        {...otherProps}
      >
        {props.children}
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </NextLink>
    );
  },

  UnderLine(props: LinkProps) {
    const { href, className, ...otherProps } = props;
    return (
      <NextLink
        href={href}
        className={cn(
          "group text-theme-muted hover:text-theme-text relative block w-fit transition-colors",
          "before:bg-theme-primary before:absolute before:inset-x-0 before:-bottom-0.5 before:h-[1.5px] before:opacity-0 before:transition-all before:duration-300 before:hover:opacity-100",
          className,
        )}
        {...otherProps}
      >
        {props.children}
      </NextLink>
    );
  },
};
