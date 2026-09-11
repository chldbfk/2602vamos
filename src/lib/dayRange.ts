import { hhmmToMinutes } from './date'

/** Shared "wake→sleep as one linear minute axis" math, used by the day timeline and the report screen. */

export function resolveDayRange(wakeTime: string, sleepTime: string): { rangeStart: number; rangeEnd: number } {
  const rangeStart = hhmmToMinutes(wakeTime)
  const rawEnd = hhmmToMinutes(sleepTime)
  const rangeEnd = rawEnd <= rangeStart ? rawEnd + 1440 : rawEnd
  return { rangeStart, rangeEnd }
}

/** Pushes a clock-time (0-1439) past midnight when it's earlier than the wake time. */
export function toRangeMinutes(clockMin: number, rangeStart: number): number {
  return clockMin < rangeStart ? clockMin + 1440 : clockMin
}

export function clampRange(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export interface Interval {
  start: number
  end: number
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals]
    .filter((iv) => iv.end > iv.start)
    .sort((a, b) => a.start - b.start)
  const merged: Interval[] = []
  for (const iv of sorted) {
    const last = merged[merged.length - 1]
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end)
    } else {
      merged.push({ ...iv })
    }
  }
  return merged
}

/** The uncovered stretches of [rangeStart, rangeEnd] once every interval is clipped and merged. */
export function findGaps(intervals: Interval[], rangeStart: number, rangeEnd: number): Interval[] {
  const clipped = intervals.map((iv) => ({
    start: clampRange(iv.start, rangeStart, rangeEnd),
    end: clampRange(iv.end, rangeStart, rangeEnd),
  }))
  const merged = mergeIntervals(clipped)
  const gaps: Interval[] = []
  let cursor = rangeStart
  for (const m of merged) {
    if (m.start > cursor) gaps.push({ start: cursor, end: m.start })
    cursor = Math.max(cursor, m.end)
  }
  if (cursor < rangeEnd) gaps.push({ start: cursor, end: rangeEnd })
  return gaps
}

export function totalMinutes(intervals: Interval[]): number {
  return intervals.reduce((sum, iv) => sum + Math.max(0, iv.end - iv.start), 0)
}

/** Formats a range-axis minute (which may be >= 1440 after the midnight push) back to a wall-clock "HH:mm". */
export function rangeMinToClock(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
