import { Avatar } from "~/components/ui/avatar";

export function WelcomeCard({
  participant,
}: {
  participant: { id: string; name: string; avatarUrl?: string | null };
}) {
  return (
    <div className="flex items-center gap-3 px-1 py-1">
      <Avatar user={participant} className="h-11 w-11 text-lg" />
      <div className="min-w-0">
        <p className="font-heading text-theme-text truncate text-lg font-semibold">
          Cześć, {participant.name}!
        </p>
      </div>
    </div>
  );
}
