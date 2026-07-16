import { EntryScreen } from "~/components/modules/auth/entry-screen";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  const safeReturnTo = returnTo && /^\/t\/[a-zA-Z0-9_-]{6,64}$/.test(returnTo) ? returnTo : null;

  return <EntryScreen initialError={error ?? null} returnTo={safeReturnTo} />;
}
