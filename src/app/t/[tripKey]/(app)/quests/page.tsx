import { redirect } from "next/navigation";

export default async function LegacyQuestsPage({
  params,
}: {
  params: Promise<{ tripKey: string }>;
}) {
  const { tripKey } = await params;
  redirect(`/t/${tripKey}/gameplay?view=challenges`);
}
