'use client';

import type { Session } from '@/lib/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekGrid(sessions: Session[], weeks = 20) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = new Map<string, number>();
  for (const s of sessions) {
    counts.set(s.date, (counts.get(s.date) || 0) + 1);
  }

  // Start from the Sunday that begins our earliest week
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay() - (weeks - 1) * 7);

  const grid: { date: string; count: number; future: boolean }[][] = [];

  for (let w = 0; w < weeks; w++) {
    const week: { date: string; count: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = cellDate.toISOString().slice(0, 10);
      week.push({
        date: dateStr,
        count: counts.get(dateStr) || 0,
        future: cellDate > today,
      });
    }
    grid.push(week);
  }

  return { grid, startDate };
}

function getMonthLabels(grid: { date: string; count: number; future: boolean }[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < grid.length; w++) {
    // Use the first day of the week (Sunday) to determine month
    const d = new Date(grid[w][0].date);
    const month = d.getMonth();
    if (month !== lastMonth) {
      labels.push({ label: MONTHS[month], col: w });
      lastMonth = month;
    }
  }

  return labels;
}

function getStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;

  const weekSet = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weekSet.add(weekStart.toISOString().slice(0, 10));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());

  let weekCheck = new Date(currentWeekStart);
  if (!weekSet.has(weekCheck.toISOString().slice(0, 10))) {
    weekCheck.setDate(weekCheck.getDate() - 7);
  }

  let streak = 0;
  while (weekSet.has(weekCheck.toISOString().slice(0, 10))) {
    streak++;
    weekCheck.setDate(weekCheck.getDate() - 7);
  }

  return streak;
}

function cellColor(count: number, future: boolean): string {
  if (future) return 'bg-zinc-900/30';
  if (count === 0) return 'bg-zinc-800/40';
  if (count === 1) return 'bg-green-500/40';
  return 'bg-green-500/70';
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function FrequencyHeatmap({ sessions }: { sessions: Session[] }) {
  const { grid } = getWeekGrid(sessions, 20);
  const monthLabels = getMonthLabels(grid);
  const streak = getStreak(sessions);

  // Count sessions this week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const thisWeekStr = weekStart.toISOString().slice(0, 10);
  const thisWeekCount = sessions.filter(s => {
    const d = new Date(s.date);
    const ws = new Date(d);
    ws.setDate(d.getDate() - d.getDay());
    return ws.toISOString().slice(0, 10) === thisWeekStr;
  }).length;

  // Total workouts in the displayed range
  const firstDate = grid[0][0].date;
  const totalInRange = sessions.filter(s => s.date >= firstDate).length;

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 mb-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-zinc-100">Workout Frequency</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {totalInRange} sessions in the last 20 weeks
          </p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <span className="text-[10px] text-green-400 font-semibold">
              {streak}w streak
            </span>
          )}
          <span className="rounded-full bg-zinc-800 border border-white/5 px-2 py-0.5 text-[10px] text-zinc-400 font-mono">
            {thisWeekCount} this week
          </span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mt-3 mb-1 pl-[20px]">
        {(() => {
          // Build a row of month labels positioned by column
          const cells: React.ReactNode[] = [];
          let lastCol = 0;
          for (const { label, col } of monthLabels) {
            if (col > lastCol) {
              // spacer
              cells.push(
                <div key={`spacer-${col}`} style={{ width: `${(col - lastCol) * 15}px` }} />
              );
            }
            cells.push(
              <span key={label + col} className="text-[9px] text-zinc-500 font-medium">
                {label}
              </span>
            );
            lastCol = col + 1;
          }
          return cells;
        })()}
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-0.5 flex-shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[12px] w-[14px] flex items-center justify-center">
              <span className="text-[8px] text-zinc-600">{i % 2 === 1 ? label : ''}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                className={`h-[12px] w-[12px] rounded-[2px] ${cellColor(day.count, day.future)} transition-colors`}
                title={`${day.date} (${DAY_LABELS[di]}): ${day.count} workout${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-600">Less</span>
          <div className="flex items-center gap-1">
            <div className="h-[10px] w-[10px] rounded-[2px] bg-zinc-800/40" title="No workout" />
            <div className="h-[10px] w-[10px] rounded-[2px] bg-green-500/40" title="1 workout" />
            <div className="h-[10px] w-[10px] rounded-[2px] bg-green-500/70" title="2+ workouts" />
          </div>
          <span className="text-[9px] text-zinc-600">More</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-[8px] w-[8px] rounded-[2px] bg-zinc-800/40" /> Rest day
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-[8px] w-[8px] rounded-[2px] bg-green-500/40" /> 1 session
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-[8px] w-[8px] rounded-[2px] bg-green-500/70" /> 2+ sessions
          </span>
        </div>
      </div>
    </section>
  );
}
