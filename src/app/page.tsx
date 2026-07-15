import { EntryScreen } from "~/components/modules/auth/entry-screen";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="text-theme-text min-h-dvh px-4 pt-4">
      <EntryScreen initialError={error ?? null} />
    </div>
  );
}
