import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { addDays, formatDateLabel, hhmmToMinutes, minutesSinceMidnight, minutesToClock, todayStr } from '../lib/date'
import { clampRange, findGaps, rangeMinToClock, resolveDayRange, totalMinutes } from '../lib/dayRange'
import PlanVsActualBars from '../components/PlanVsActualBars'
import type { ColoredInterval } from '../components/PlanVsActualBars'

export default function ReportScreen() {
  const { projects, tasks, timeLogs, settings } = useAppStore()
  const [date, setDate] = useState(todayStr())
  const isToday = date === todayStr()

  const [, tick] = useState(0)
  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [isToday])

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const { rangeStart, rangeEnd } = useMemo(
    () => resolveDayRange(settings.wakeTime, settings.sleepTime),
    [settings.wakeTime, settings.sleepTime],
  )

  function toRangeMin(clockMin: number): number {
    return clockMin < rangeStart ? clockMin + 1440 : clockMin
  }

  const dayTasks = useMemo(() => tasks.filter((t) => t.date === date), [tasks, date])
  const dayLogs = useMemo(() => timeLogs.filter((l) => l.date === date), [timeLogs, date])

  const planned = useMemo<ColoredInterval[]>(
    () =>
      dayTasks
        .filter((t) => t.planStart && t.planEnd)
        .map((t) => {
          const p = projectById.get(t.projectId)
          return {
            start: toRangeMin(hhmmToMinutes(t.planStart!)),
            end: toRangeMin(hhmmToMinutes(t.planEnd!)),
            color: p?.color ?? 'var(--text-faint)',
            label: t.title,
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toRangeMin closes over rangeStart, already covered
    [dayTasks, projectById, rangeStart],
  )

  const runningTask = tasks.find((t) => t.isRunning && t.date === date && t.runningStartedAt)
  const nowRangeMin = toRangeMin(minutesSinceMidnight(new Date()))

  const actual = useMemo<ColoredInterval[]>(() => {
    const taskById = new Map(tasks.map((t) => [t.id, t]))
    const out: ColoredInterval[] = dayLogs.map((l) => {
      const t = taskById.get(l.taskId)
      const p = t ? projectById.get(t.projectId) : undefined
      return {
        start: toRangeMin(l.startMin),
        end: toRangeMin(l.endMin),
        color: p?.color ?? 'var(--text-faint)',
        label: t?.title ?? '',
      }
    })
    if (runningTask?.runningStartedAt) {
      const p = projectById.get(runningTask.projectId)
      out.push({
        start: toRangeMin(minutesSinceMidnight(new Date(runningTask.runningStartedAt))),
        end: nowRangeMin,
        color: p?.color ?? 'var(--text-faint)',
        label: runningTask.title,
        live: true,
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ticks live via the interval above
  }, [dayLogs, tasks, projectById, rangeStart, runningTask, nowRangeMin])

  const effectiveEnd = isToday ? clampRange(nowRangeMin, rangeStart, rangeEnd) : rangeEnd

  const plannedMinutes = totalMinutes(
    planned.map((iv) => ({ start: clampRange(iv.start, rangeStart, rangeEnd), end: clampRange(iv.end, rangeStart, rangeEnd) })),
  )
  const actualMinutes = totalMinutes(
    actual.map((iv) => ({ start: clampRange(iv.start, rangeStart, effectiveEnd), end: clampRange(iv.end, rangeStart, effectiveEnd) })),
  )
  const elapsedMinutes = Math.max(0, effectiveEnd - rangeStart)
  const idleMinutes = Math.max(0, elapsedMinutes - actualMinutes)
  const adherence = plannedMinutes > 0 ? Math.round((actualMinutes / plannedMinutes) * 100) : null

  const gaps = useMemo(
    () =>
      findGaps(actual, rangeStart, effectiveEnd)
        .filter((g) => g.end - g.start >= 10)
        .sort((a, b) => b.end - b.start - (a.end - a.start)),
    [actual, rangeStart, effectiveEnd],
  )

  function shiftDate(delta: number) {
    setDate((d) => addDays(d, delta))
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '18px 20px 10px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>리포트</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => shiftDate(-1)} style={navBtn} aria-label="전날">
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{formatDateLabel(date)}</span>
          <button onClick={() => shiftDate(1)} style={navBtn} aria-label="다음날">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px', flexShrink: 0 }}>
        <StatTile label="계획" value={minutesToClock(Math.round(plannedMinutes))} color="var(--brand)" />
        <StatTile label="실행" value={minutesToClock(Math.round(actualMinutes))} color="var(--growth)" />
        <StatTile label="버려진 시간" value={minutesToClock(Math.round(idleMinutes))} color="var(--coral)" />
      </div>

      {adherence !== null && (
        <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>계획 대비 수행률</span>
            <span style={{ fontWeight: 800, color: 'var(--text)' }}>{adherence}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, adherence)}%`,
                height: '100%',
                background: adherence >= 80 ? 'var(--growth)' : adherence >= 40 ? '#ff9500' : 'var(--coral)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
        <PlanVsActualBars
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          nowInRange={nowRangeMin}
          isToday={isToday}
          planned={planned}
          actual={actual}
        />
      </div>

      <div style={{ flexShrink: 0, padding: '12px 20px 90px' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
          비어있던 시간대
        </div>
        {gaps.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', padding: '8px 0' }}>
            {plannedMinutes === 0 && actualMinutes === 0
              ? '아직 계획하거나 기록한 게 없어요'
              : '기록되지 않은 시간이 없어요 — 알차게 보냈네요!'}
          </div>
        ) : (
          <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 130, overflowY: 'auto' }}>
            {gaps.map((g, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px 12px',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {rangeMinToClock(g.start)}–{rangeMinToClock(g.end)}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--coral)' }}>
                  {minutesToClock(g.end - g.start)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '10px 8px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color, marginTop: 3 }}>{value}</div>
    </div>
  )
}

const navBtn = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  color: 'var(--text-muted)',
} as const
