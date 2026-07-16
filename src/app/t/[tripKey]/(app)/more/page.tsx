import { MoreMenu } from "~/components/more-menu";

export default function MorePage() {
  return (
    <div className="animate-fade-in pb-safe flex flex-col gap-6 pt-4">
      <header>
        <p className="text-theme-primary mb-2 text-xs font-bold tracking-widest uppercase">
          Wszystko pod ręką
        </p>
        <h1 className="font-heading text-theme-text text-5xl font-semibold">Więcej</h1>
      </header>
      <MoreMenu />
    </div>
  );
}
