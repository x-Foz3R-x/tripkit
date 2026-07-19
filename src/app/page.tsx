import { EntryScreen } from "~/components/modules/auth/entry-screen";

type Props = { searchParams: Promise<{ error?: string; returnTo?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const { error, returnTo } = await searchParams;
  const safeReturnTo = returnTo && /^\/t\/[a-zA-Z0-9_-]{6,64}$/.test(returnTo) ? returnTo : null;

  return <EntryScreen initialError={error ?? null} returnTo={safeReturnTo} />;
}
