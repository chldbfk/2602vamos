import type { RecurrenceRule } from '../types'

function parse(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function diffDays(a: string, b: string): number {
  const MS_PER_DAY = 86400000
  return Math.round((parse(b).getTime() - parse(a).getTime()) / MS_PER_DAY)
}

/** Sunday-start week index for a date — used to test "every N weeks" without caring what
 *  weekday the rule's anchor happens to fall on. */
function weekIndex(dateStr: string): number {
  const d = parse(dateStr)
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - d.getDay())
  return Math.floor(weekStart.getTime() / 86400000)
}

/** Does `dateStr` fall on one of `rule`'s occurrences, given the template was created/anchored
 *  on `anchorDate`? Occurrences never land before the anchor or after `rule.endDate`. */
export function matchesRecurrence(rule: RecurrenceRule, dateStr: string, anchorDate: string): boolean {
  if (dateStr < anchorDate) return false
  if (rule.endDate && dateStr > rule.endDate) return false
  const interval = Math.max(1, rule.interval || 1)

  if (rule.freq === 'daily') {
    return diffDays(anchorDate, dateStr) % interval === 0
  }

  // weekly
  const weekday = parse(dateStr).getDay()
  const days = rule.daysOfWeek && rule.daysOfWeek.length > 0 ? rule.daysOfWeek : [parse(anchorDate).getDay()]
  if (!days.includes(weekday)) return false
  return (weekIndex(dateStr) - weekIndex(anchorDate)) % (interval * 7) === 0
}

/** Every date in `rule` between `fromDate` and `toDate` (inclusive), clamped to the anchor. */
export function occurrencesInRange(
  rule: RecurrenceRule,
  anchorDate: string,
  fromDate: string,
  toDate: string,
): string[] {
  const start = fromDate < anchorDate ? anchorDate : fromDate
  const out: string[] = []
  let cursor = parse(start)
  const end = parse(toDate)
  while (cursor.getTime() <= end.getTime()) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    if (matchesRecurrence(rule, dateStr, anchorDate)) out.push(dateStr)
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

/** Short Korean label for a rule — "매일", "2일마다", "매주 월·수·금", "3주마다 화요일". */
export function describeRecurrence(rule: RecurrenceRule): string {
  const interval = Math.max(1, rule.interval || 1)
  if (rule.freq === 'daily') {
    return interval === 1 ? '매일 반복' : `${interval}일마다 반복`
  }
  const days = (rule.daysOfWeek ?? []).map((d) => WEEKDAY_LABELS[d]).join('·')
  const dayPart = days ? ` ${days}` : ''
  return interval === 1 ? `매주${dayPart} 반복` : `${interval}주마다${dayPart} 반복`
}
