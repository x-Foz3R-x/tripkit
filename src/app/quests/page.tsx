// src/app/quests/page.tsx
export default function QuestsPage() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Zlecenia</h1>
        <p className="text-sm text-gray-400">Zadania do odhaczenia na wyjeździe.</p>
      </header>
      <section className="flex flex-col gap-3">
        {/* Placeholder dla zadania */}
        <div className="bg-witch-card rounded-xl border border-white/5 p-4">
          <h3 className="font-medium text-white">Rozpalić ognisko</h3>
          <p className="text-xs text-gray-400">Przypisano: Oczekuje na śmiałka</p>
        </div>
      </section>
    </div>
  );
}
