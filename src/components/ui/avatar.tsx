import { cn } from "~/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-500",
  "bg-theme-success/20 text-theme-success",
  "bg-rose-500/20 text-rose-500",
  "bg-amber-500/20 text-amber-500",
  "bg-green-500/20 text-green-500",
  "bg-cyan-500/20 text-cyan-500",
  "bg-fuchsia-500/20 text-fuchsia-500",
];

// Funkcja, która zawsze zwraca ten sam index koloru dla danego tekstu (np. ID)
function getColorClass(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << AVATAR_COLORS.length) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

interface AvatarProps {
  user: { id: string; name: string };
  className?: string;
}

export function Avatar({ user, className }: AvatarProps) {
  const colorClass = getColorClass(user.id);

  return (
    <div
      className={cn(
        "font-heading flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl uppercase",
        colorClass,
        className,
      )}
    >
      {user.name.charAt(0)}
    </div>
  );
}
