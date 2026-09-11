export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return toDateStr(dt)
}

export function todayStr(): string {
  return toDateStr(new Date())
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${m}월 ${d}일 (${WEEKDAYS_KO[dt.getDay()]})`
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr()
}

export function weekdayKo(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return WEEKDAYS_KO[new Date(y, m - 1, d).getDay()]
}

export function minutesToClock(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m}분`
  return `${h}시간 ${m}분`
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

export function nowHHmm(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Returns a 6x7 month grid of date strings, including leading/trailing days from adjacent months. */
export function getMonthGrid(year: number, month0: number): string[] {
  const first = new Date(year, month0, 1)
  const startOffset = first.getDay() // 0=Sun
  const gridStart = new Date(year, month0, 1 - startOffset)
  const days: string[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(toDateStr(d))
  }
  return days
}
