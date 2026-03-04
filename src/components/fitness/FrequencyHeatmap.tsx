'use client';

import type { Session } from '@/lib/types';

function getWeekGrid(sessions: Session[], weeks = 20) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count workouts per date
  const counts = new Map<string, number>();
  for (const s of sessions) {
    counts.set(s.date, (counts.get(s.date) || 0) + 1);
  }

  // Build grid: columns = weeks, rows = days (Sun=0 to Sat=6)
  // Find the Sunday that starts the earliest week we want to show
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

  return grid;
}

function getStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;

  const dates = new Set(sessions.map(s => s.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Check if worked out today; if not, start from yesterday
  const todayStr = checkDate.toISOString().slice(0, 10);
  if (!dates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days with workouts (checking week-by-week: skip rest days within a week)
  // For fitness, let's count consecutive weeks with at least one workout
  const weekSet = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weekSet.add(weekStart.toISOString().slice(0, 10));
  }

  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());

  let weekCheck = new Date(currentWeekStart);
  // If current week has no workout yet, start from last week
  if (!weekSet.has(weekCheck.toISOString().slice(0, 10))) {
    weekCheck.setDate(weekCheck.getDate() - 7);
  }

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

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

export default function FrequencyHeatmap({ sessions }: { sessions: Session[] }) {
  const grid = getWeekGrid(sessions, 20);
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

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-zinc-100">Workout Frequency</h2>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <span className="text-[10px] text-green-400 font-semibold">
              {streak}w streak
            </span>
          )}
          <span className="text-[10px] text-zinc-500">{thisWeekCount} this week</span>
        </div>
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[12px] w-[12px] flex items-center justify-center">
              <span className="text-[8px] text-zinc-600">{label}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                className={`h-[12px] w-[12px] rounded-[2px] ${cellColor(day.count, day.future)}`}
                title={`${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px] text-zinc-600">Less</span>
        <div className="h-[10px] w-[10px] rounded-[2px] bg-zinc-800/40" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-green-500/40" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-green-500/70" />
        <span className="text-[9px] text-zinc-600">More</span>
      </div>
    </section>
  );
}
