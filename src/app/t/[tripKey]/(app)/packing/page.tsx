import { redirect } from "next/navigation";

export default async function PackingPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  redirect(`/t/${tripKey}?packing=open`);
}
