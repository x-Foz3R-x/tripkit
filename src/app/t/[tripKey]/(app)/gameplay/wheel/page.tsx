import { GameplayPageContent } from "~/components/modules/scoreboard/gameplay-page-content";

export default async function WheelPage({ params }: { params: Promise<{ tripKey: string }> }) {
  const { tripKey } = await params;
  return <GameplayPageContent tripKey={tripKey} view="wheel" />;
}
