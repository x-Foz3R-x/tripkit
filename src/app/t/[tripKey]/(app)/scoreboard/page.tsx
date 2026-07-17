import { redirect } from "next/navigation";

export default async function LegacyScoreboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripKey: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const [{ tripKey }, query] = await Promise.all([params, searchParams]);
  const view = Array.isArray(query.view) ? query.view[0] : query.view;
  redirect(`/t/${tripKey}/gameplay${view ? `?view=${encodeURIComponent(view)}` : ""}`);
}
