import { StartScreen } from "~/components/modules/auth/start-screen";

export function EntryScreen({
  initialError,
  returnTo,
}: {
  initialError?: string | null;
  returnTo?: string | null;
}) {
  return <StartScreen initialError={initialError} returnTo={returnTo} />;
}
