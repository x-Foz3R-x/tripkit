import { cn } from "~/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  return (
    <div
      role="presentation"
      className={cn("bg-theme-muted/20 pointer-events-none animate-pulse select-none", className)}
      {...props}
    />
  );
}
