import { Skeleton } from "~/components/ui/skeleton";

export default function AppPageLoading() {
  return (
    <div className="flex flex-col gap-5 pt-4" aria-label="Ładowanie podstrony" aria-live="polite">
      <div className="bg-theme-primary/70 h-1 w-full animate-pulse rounded-full" />
      <Skeleton className="h-12 w-2/3 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}
