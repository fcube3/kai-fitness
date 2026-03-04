import type { Session, HealthMetric } from './types';
import { totalVolume } from './fitness-utils';
import { best1RM } from './one-rep-max';

/** Get the ISO week-start (Sunday) for a date */
function weekStart(d: Date): string {
  const ws = new Date(d);
  ws.setDate(ws.getDate() - ws.getDay());
  return ws.toISOString().slice(0, 10);
}

/** Compute weekly volume totals from sessions */
function weeklyVolumes(sessions: Session[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = weekStart(new Date(s.date));
    map.set(key, (map.get(key) || 0) + totalVolume(s));
  }
  return map;
}

/**
 * Acute:Chronic Workload Ratio (ACWR)
 * Acute = average weekly volume over last `acute` weeks
 * Chronic = average weekly volume over last `chronic` weeks
 * Optimal zone: 0.8–1.3
 */
export function computeACWR(
  sessions: Session[],
  acuteWeeks = 1,
  chronicWeeks = 4,
): { ratio: number; acute: number; chronic: number; zone: 'optimal' | 'caution' | 'danger' } {
  const vols = weeklyVolumes(sessions);
  const weeks = Array.from(vols.entries())
    .sort((a, b) => b[0].localeCompare(a[0])); // most recent first

  if (weeks.length < 2) return { ratio: 1, acute: 0, chronic: 0, zone: 'optimal' };

  const acuteVols = weeks.slice(0, acuteWeeks).map(w => w[1]);
  const chronicVols = weeks.slice(0, chronicWeeks).map(w => w[1]);

  const acute = acuteVols.reduce((a, b) => a + b, 0) / acuteVols.length;
  const chronic = chronicVols.reduce((a, b) => a + b, 0) / chronicVols.length;

  if (chronic === 0) return { ratio: 1, acute, chronic, zone: 'optimal' };

  const ratio = Math.round((acute / chronic) * 100) / 100;
  const zone = ratio >= 0.8 && ratio <= 1.3 ? 'optimal'
    : ratio >= 0.5 && ratio <= 1.5 ? 'caution'
    : 'danger';

  return { ratio, acute, chronic, zone };
}

/**
 * Volume trend: current week vs trailing 4-week average
 */
export function computeVolumeTrend(
  sessions: Session[],
  trailingWeeks = 4,
): {
  currentWeek: number;
  average: number;
  delta: number; // percentage
  weeklyData: { week: string; volume: number }[];
} {
  const vols = weeklyVolumes(sessions);
  const weeks = Array.from(vols.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (weeks.length === 0) {
    return { currentWeek: 0, average: 0, delta: 0, weeklyData: [] };
  }

  const currentWeek = weeks[weeks.length - 1][1];
  const trailingStart = Math.max(0, weeks.length - 1 - trailingWeeks);
  const trailing = weeks.slice(trailingStart, weeks.length - 1);
  const average = trailing.length > 0
    ? trailing.reduce((sum, w) => sum + w[1], 0) / trailing.length
    : currentWeek;

  const delta = average > 0 ? Math.round(((currentWeek - average) / average) * 100) : 0;

  // Return last 8 weeks for sparkline
  const weeklyData = weeks.slice(-8).map(([week, volume]) => ({ week, volume }));

  return { currentWeek, average, delta, weeklyData };
}

/**
 * E1RM progression for a given exercise over time
 */
export function computeE1RMProgression(
  sessions: Session[],
  exerciseName: string,
): {
  current: number;
  fourWeeksAgo: number;
  delta: number;
  dataPoints: { date: string; e1rm: number }[];
} {
  const fourWeeksBack = new Date();
  fourWeeksBack.setDate(fourWeeksBack.getDate() - 28);

  const dataPoints: { date: string; e1rm: number }[] = [];

  for (const s of sessions) {
    const ex = s.exercises.find(e => e.name === exerciseName);
    if (!ex) continue;
    const result = best1RM(ex.sets);
    if (result) {
      dataPoints.push({ date: s.date, e1rm: result.e1rm });
    }
  }

  dataPoints.sort((a, b) => a.date.localeCompare(b.date));

  const current = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].e1rm : 0;

  // Find the e1RM closest to 4 weeks ago
  const olderPoints = dataPoints.filter(d => new Date(d.date) <= fourWeeksBack);
  const fourWeeksAgo = olderPoints.length > 0 ? olderPoints[olderPoints.length - 1].e1rm : current;

  const delta = fourWeeksAgo > 0 ? Math.round(((current - fourWeeksAgo) / fourWeeksAgo) * 100) : 0;

  return { current, fourWeeksAgo, delta, dataPoints };
}

/**
 * ACWR over time for chart visualization
 */
export function computeACWRTimeline(
  sessions: Session[],
  weeks = 12,
): { week: string; acwr: number; volume: number }[] {
  const vols = weeklyVolumes(sessions);
  const allWeeks = Array.from(vols.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  const result: { week: string; acwr: number; volume: number }[] = [];

  for (let i = 0; i < allWeeks.length; i++) {
    const [week, volume] = allWeeks[i];
    // Chronic = avg of last 4 weeks (including current)
    const start = Math.max(0, i - 3);
    const chronicSlice = allWeeks.slice(start, i + 1);
    const chronic = chronicSlice.reduce((sum, w) => sum + w[1], 0) / chronicSlice.length;
    const acwr = chronic > 0 ? Math.round((volume / chronic) * 100) / 100 : 1;
    result.push({ week: week.slice(5), acwr, volume });
  }

  return result.slice(-weeks);
}

/**
 * Find the most-trained compound lift for the InsightCards e1RM display
 */
export function findTopCompound(sessions: Session[]): string | null {
  const compounds = ['Hack Squat', 'Deadlift', 'Low incline bench', 'Squat', 'Flat bench press',
    'Shoulder press', 'Normal grip bench press', 'Medium grip bench press', 'Leg press', 'RDL'];

  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (compounds.includes(ex.name)) {
        counts.set(ex.name, (counts.get(ex.name) || 0) + 1);
      }
    }
  }

  if (counts.size === 0) return null;
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Weekly streak count (consecutive weeks with at least one session)
 */
export function computeStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;

  const weekSet = new Set<string>();
  for (const s of sessions) {
    weekSet.add(weekStart(new Date(s.date)));
  }

  const today = new Date();
  let checkWeek = new Date(today);
  checkWeek.setDate(checkWeek.getDate() - checkWeek.getDay());

  // If current week has no workout, start from last week
  if (!weekSet.has(checkWeek.toISOString().slice(0, 10))) {
    checkWeek.setDate(checkWeek.getDate() - 7);
  }

  let streak = 0;
  while (weekSet.has(checkWeek.toISOString().slice(0, 10))) {
    streak++;
    checkWeek.setDate(checkWeek.getDate() - 7);
  }

  return streak;
}

/**
 * Strength-to-bodyweight ratio
 */
export function computeStrengthRatio(e1rm: number, bodyWeight: number): number {
  if (bodyWeight <= 0) return 0;
  return Math.round((e1rm / bodyWeight) * 100) / 100;
}

/**
 * Recovery Score (0-100)
 * Composite score from available health data:
 *   - HRV vs personal baseline (40% weight)
 *   - Resting HR delta (20% weight)
 *   - Sleep hours (30% weight)
 *   - Days since last session (10% weight)
 * Falls back to session-frequency-only if no health data.
 */
export function computeRecoveryScore(
  sessions: Session[],
  healthMetrics: HealthMetric[],
): { score: number; label: string; factors: { name: string; score: number; weight: number }[] } {
  const factors: { name: string; score: number; weight: number }[] = [];
  const hasHealth = healthMetrics.length > 0;

  // Helper: get metrics by type sorted by date
  const byType = (type: string) =>
    healthMetrics
      .filter(m => m.metric_type === type)
      .sort((a, b) => a.date.localeCompare(b.date));

  // 1. HRV (40% when available)
  const hrvData = byType('hrv');
  if (hrvData.length >= 3) {
    const recent = hrvData[hrvData.length - 1].value;
    const baseline = hrvData.reduce((sum, m) => sum + m.value, 0) / hrvData.length;
    // Higher HRV = better recovery. Score based on % of baseline
    const hrvRatio = baseline > 0 ? recent / baseline : 1;
    const hrvScore = Math.min(100, Math.max(0, Math.round(hrvRatio * 80)));
    factors.push({ name: 'HRV', score: hrvScore, weight: 0.4 });
  }

  // 2. Resting HR (20% when available)
  const hrData = byType('resting_hr');
  if (hrData.length >= 3) {
    const recent = hrData[hrData.length - 1].value;
    const baseline = hrData.reduce((sum, m) => sum + m.value, 0) / hrData.length;
    // Lower resting HR = better. Inverse scoring
    const hrRatio = baseline > 0 ? baseline / recent : 1;
    const hrScore = Math.min(100, Math.max(0, Math.round(hrRatio * 80)));
    factors.push({ name: 'Resting HR', score: hrScore, weight: 0.2 });
  }

  // 3. Sleep (30% when available)
  const sleepData = byType('sleep_hours');
  if (sleepData.length >= 1) {
    const recent = sleepData[sleepData.length - 1].value;
    // 7-9 hours optimal; score degrades outside this range
    const sleepScore = recent >= 7 && recent <= 9
      ? Math.min(100, Math.round(recent / 8 * 90))
      : recent < 7
        ? Math.max(0, Math.round((recent / 7) * 70))
        : Math.max(50, Math.round(100 - (recent - 9) * 10));
    factors.push({ name: 'Sleep', score: sleepScore, weight: 0.3 });
  }

  // 4. Rest days (10% always available)
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length > 0) {
    const lastDate = new Date(sorted[0].date);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    // 1-2 days rest = optimal, 0 = just trained, 3+ = too much rest
    const restScore = daysSince === 0 ? 60
      : daysSince === 1 ? 90
      : daysSince === 2 ? 85
      : daysSince === 3 ? 70
      : Math.max(30, 70 - (daysSince - 3) * 10);
    factors.push({ name: 'Rest', score: restScore, weight: hasHealth ? 0.1 : 1.0 });
  }

  if (factors.length === 0) {
    return { score: 75, label: 'Unknown', factors: [] };
  }

  // Normalize weights if we don't have all health factors
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight / totalWeight), 0)
  );

  const label = score >= 80 ? 'Ready' : score >= 60 ? 'Moderate' : score >= 40 ? 'Fatigued' : 'Rest';

  return { score, label, factors };
}

/**
 * Build a unified timeline for RecoveryTrends chart
 * Aligns training volume, HRV, resting HR, and sleep by date
 */
export function buildRecoveryTimeline(
  sessions: Session[],
  healthMetrics: HealthMetric[],
  weeks = 8,
): {
  date: string;
  volume: number | null;
  hrv: number | null;
  restingHr: number | null;
  sleep: number | null;
}[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Build date set from both sources
  const dateMap = new Map<string, {
    volume: number | null;
    hrv: number | null;
    restingHr: number | null;
    sleep: number | null;
  }>();

  // Add session volumes by date
  for (const s of sessions) {
    if (s.date < cutoffStr) continue;
    const existing = dateMap.get(s.date) || { volume: null, hrv: null, restingHr: null, sleep: null };
    existing.volume = (existing.volume || 0) + totalVolume(s);
    dateMap.set(s.date, existing);
  }

  // Add health metrics
  for (const m of healthMetrics) {
    if (m.date < cutoffStr) continue;
    const existing = dateMap.get(m.date) || { volume: null, hrv: null, restingHr: null, sleep: null };
    if (m.metric_type === 'hrv') existing.hrv = m.value;
    else if (m.metric_type === 'resting_hr') existing.restingHr = m.value;
    else if (m.metric_type === 'sleep_hours') existing.sleep = m.value;
    dateMap.set(m.date, existing);
  }

  return Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date: date.slice(5), ...data }));
}
