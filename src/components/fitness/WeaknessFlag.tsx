'use client';

export default function WeaknessFlags({ weaknesses }: { weaknesses: string[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-zinc-100">Weakness Flags</h2>
        <span className="text-[10px] text-zinc-500">4+ week stall</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {weaknesses.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-3">
            <span className="text-green-400 text-sm">✓</span>
            <p className="text-sm text-green-300">All lifts progressing</p>
          </div>
        ) : weaknesses.map(name => (
          <div key={name} className="flex items-center gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
            <span className="text-amber-400 text-xs shrink-0">⚠</span>
            <span className="text-sm text-zinc-200 truncate">{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
