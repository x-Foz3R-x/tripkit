import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar } from "~/components/ui/avatar";

export function WelcomeCard({
  participant,
  urlKey,
}: {
  participant: { id: string; name: string };
  urlKey: string;
}) {
  return (
    <div className="bg-theme-card border-theme-border flex items-center justify-between rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar user={participant} className="h-12 w-12" />
        <div>
          <p className="text-theme-muted text-sm">Gotowy na wyjazd?</p>
          <p className="text-theme-text text-lg font-semibold">Cześć, {participant.name}!</p>
        </div>
      </div>
      <Link
        href={`/t/${urlKey}/join`}
        className="text-theme-muted hover:text-theme-text flex flex-col items-center gap-1 text-xs transition-colors"
      >
        <LogOut size={16} />
        <span>Zmień</span>
      </Link>
    </div>
  );
}
