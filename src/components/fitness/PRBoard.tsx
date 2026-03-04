'use client';

import type { PR } from '@/lib/types';

export default function PRBoard({ prs }: { prs: PR[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-zinc-100">PR Board</h2>
        <span className="text-[10px] text-zinc-500">{prs.length} lifts</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {prs.slice(0, 15).map((pr, i) => (
          <div
            key={pr.name}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 gap-2 ${
              i === 0
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-zinc-800/60 border border-white/5'
            }`}
          >
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${i === 0 ? 'text-green-300' : 'text-zinc-200'}`}>
                {i === 0 && <span className="mr-1.5 text-[10px]">👑</span>}
                {pr.name}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{pr.date}</p>
            </div>
            <span className={`text-base font-bold tabular-nums shrink-0 ${i === 0 ? 'text-green-400' : 'text-zinc-300'}`}>
              {pr.weight}<span className="text-xs font-normal text-zinc-500">kg</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
