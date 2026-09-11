import type { ReflectionEntry, TaskItem } from '../types'
import { addDays, todayStr } from './date'

/** Consecutive days (ending today or yesterday) present in `dates`. */
function streakFromDates(dates: Set<string>): number {
  let cursor = todayStr()
  if (!dates.has(cursor)) {
    // today not done yet — streak still counts from yesterday backwards
    cursor = addDays(cursor, -1)
  }
  let streak = 0
  while (dates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Consecutive days (ending today or yesterday) that have at least one completed task. */
export function computeStreak(tasks: TaskItem[]): number {
  return streakFromDates(new Set(tasks.filter((t) => t.done).map((t) => t.date)))
}

/** Consecutive days (ending today or yesterday) with a non-empty reflection entry. */
export function computeReflectionStreak(reflections: ReflectionEntry[]): number {
  return streakFromDates(new Set(reflections.filter((r) => r.text.trim().length > 0).map((r) => r.date)))
}
