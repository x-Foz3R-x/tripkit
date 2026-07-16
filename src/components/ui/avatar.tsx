import { cn } from "~/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-900 text-blue-200",
  "bg-emerald-900 text-emerald-200",
  "bg-rose-900 text-rose-200",
  "bg-amber-900 text-amber-200",
  "bg-green-900 text-green-200",
  "bg-cyan-900 text-cyan-200",
  "bg-fuchsia-900 text-fuchsia-200",
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
  user: { id: string; name: string; avatarUrl?: string | null };
  className?: string;
}

export function Avatar({ user, className }: AvatarProps) {
  const colorClass = getColorClass(user.id);

  return (
    <div
      role="img"
      aria-label={`Avatar ${user.name}`}
      style={
        user.avatarUrl
          ? {
              backgroundImage: `url(${JSON.stringify(user.avatarUrl)})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      className={cn(
        "font-heading flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl uppercase",
        colorClass,
        className,
      )}
    >
      {!user.avatarUrl && user.name.charAt(0)}
    </div>
  );
}
