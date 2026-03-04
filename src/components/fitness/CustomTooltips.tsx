'use client';

import { formatVol } from '@/lib/fitness-utils';

const GREEN = '#22C55E';

export function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: GREEN }}>{payload[0].value}kg</p>
    </div>
  );
}

export function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: GREEN }}>{formatVol(payload[0].value)}</p>
    </div>
  );
}
