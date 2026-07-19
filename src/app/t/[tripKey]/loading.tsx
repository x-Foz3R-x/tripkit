import { Skeleton } from "~/components/ui/skeleton";

export default function TripLoading() {
  return (
    <div className="flex flex-col gap-6 pt-4" aria-label="Ładowanie wyjazdu">
      <Skeleton className="h-14 w-3/4 rounded-xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
