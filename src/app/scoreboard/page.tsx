// src/app/scoreboard/page.tsx
export default function ScoreboardPage() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Punkty</h1>
        <p className="text-sm text-gray-400">Ranking drużyn.</p>
      </header>
      <section className="grid gap-4">
        {/* Placeholder dla drużyny */}
        <div className="bg-witch-card flex items-center justify-between rounded-xl border border-white/5 p-4">
          <span className="font-semibold text-white">Drużyna A</span>
          <span className="text-witch-primary text-xl font-bold">120 pkt</span>
        </div>
      </section>
    </div>
  );
}
