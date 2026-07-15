import Link from "next/link";

export default function TripNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-heading text-theme-text text-3xl font-semibold">
        Nie znaleziono wyjazdu
      </h1>
      <p className="text-theme-muted max-w-72 text-sm">
        Link jest nieprawidłowy albo wyjazd został usunięty.
      </p>
      <Link
        href="/"
        className="bg-theme-primary text-theme-primary-foreground rounded-xl px-5 py-3 text-sm font-bold"
      >
        Wpisz PIN wyjazdu
      </Link>
    </div>
  );
}
