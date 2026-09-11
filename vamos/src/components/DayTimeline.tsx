import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { hhmmToMinutes, minutesSinceMidnight, todayStr } from '../lib/date'
import type { Project, TaskItem, TimeLog } from '../types'

const MIN_PX_PER_MIN = 0.45 // below this, hour labels start overlapping — scroll instead of squashing further

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

interface Segment {
  key: string
  top: number
  height: number
  color: string
  label: string
  live: boolean
}

export default function DayTimeline({
  date,
  wakeTime,
  sleepTime,
  timeLogs,
  tasks,
  projectById,
}: {
  date: string
  wakeTime: string
  sleepTime: string
  timeLogs: TimeLog[]
  tasks: TaskItem[]
  projectById: Map<string, Project>
}) {
  const isToday = date === todayStr()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [, tick] = useState(0)

  const rangeStart = hhmmToMinutes(wakeTime)
  const rangeEndRaw = hhmmToMinutes(sleepTime)
  const rangeEnd = rangeEndRaw <= rangeStart ? rangeEndRaw + 1440 : rangeEndRaw
  const totalMin = rangeEnd - rangeStart

  // Fit the whole wake→sleep range into the available height instead of forcing a scroll.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerHeight(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pxPerMin = Math.max(MIN_PX_PER_MIN, containerHeight > 0 ? containerHeight / totalMin : 0)
  const totalPx = Math.max(containerHeight, totalMin * MIN_PX_PER_MIN)

  // Keep the "now" line (and the live-running segment) ticking even if nothing is running.
  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [isToday])

  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  /** Minutes since the wake time "epoch", pushed past midnight when the clock time is before wake. */
  function toRangeMinutes(clockMin: number): number {
    return clockMin < rangeStart ? clockMin + 1440 : clockMin
  }

  const segments = useMemo<Segment[]>(() => {
    const out: Segment[] = []
    for (const log of timeLogs) {
      if (log.date !== date) continue
      const t = taskById.get(log.taskId)
      const project = t ? projectById.get(t.projectId) : undefined
      if (!t || !project) continue
      const s = clamp(toRangeMinutes(log.startMin), rangeStart, rangeEnd)
      const e = clamp(toRangeMinutes(log.endMin), rangeStart, rangeEnd)
      out.push({
        key: log.id,
        top: (s - rangeStart) * pxPerMin,
        height: Math.max(4, (e - s) * pxPerMin),
        color: project.color,
        label: t.title,
        live: false,
      })
    }

    // the currently running task extends live, past its last saved log
    const running = tasks.find((t) => t.isRunning && t.date === date && t.runningStartedAt)
    if (running && running.runningStartedAt) {
      const project = projectById.get(running.projectId)
      if (project) {
        const s = clamp(toRangeMinutes(minutesSinceMidnight(new Date(running.runningStartedAt))), rangeStart, rangeEnd)
        const e = clamp(toRangeMinutes(minutesSinceMidnight(new Date())), rangeStart, rangeEnd)
        out.push({
          key: `${running.id}-live`,
          top: (s - rangeStart) * pxPerMin,
          height: Math.max(4, (e - s) * pxPerMin),
          color: project.color,
          label: running.title,
          live: true,
        })
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ticks every second via local state to recompute "now"
  }, [timeLogs, tasks, taskById, projectById, date, rangeStart, rangeEnd, pxPerMin])

  const markers = useMemo(
    () =>
      tasks
        .filter((t) => t.date === date && t.done && t.completedAt && t.type === 'completable')
        .map((t) => {
          const project = projectById.get(t.projectId)
          if (!project) return null
          const min = clamp(toRangeMinutes(hhmmToMinutes(t.completedAt!)), rangeStart, rangeEnd)
          return {
            key: t.id,
            top: (min - rangeStart) * pxPerMin,
            color: project.color,
            label: t.title,
          }
        })
        .filter((m): m is NonNullable<typeof m> => m !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toRangeMinutes closes over rangeStart, already a dep
    [tasks, date, projectById, rangeStart, rangeEnd, pxPerMin],
  )

  const hours: number[] = []
  for (let h = Math.ceil(rangeStart / 60) * 60; h <= rangeEnd; h += 60) hours.push(h)

  const nowMin = clamp(toRangeMinutes(minutesSinceMidnight(new Date())), rangeStart, rangeEnd)
  const nowY = (nowMin - rangeStart) * pxPerMin

  return (
    <div ref={containerRef} className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ position: 'relative', height: totalPx, margin: '4px 4px 6px' }}>
        {hours.map((h) => (
          <div
            key={h}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (h - rangeStart) * pxPerMin,
              borderTop: '1px dashed var(--border)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: -6,
                fontSize: 9,
                color: 'var(--text-faint)',
                background: 'var(--bg)',
                paddingRight: 2,
              }}
            >
              {Math.round(h / 60) % 24}
            </span>
          </div>
        ))}

        {segments.map((s) => (
          <div
            key={s.key}
            title={s.label}
            style={{
              position: 'absolute',
              top: s.top,
              height: s.height,
              left: 20,
              right: 2,
              background: s.color,
              borderRadius: 5,
              boxShadow: s.live ? 'inset 0 0 0 2px rgba(255,255,255,0.7)' : 'none',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px',
            }}
          >
            {s.height >= 16 && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.label}
              </span>
            )}
          </div>
        ))}

        {markers.map((m) => (
          <div
            key={m.key}
            title={m.label}
            style={{
              position: 'absolute',
              top: m.top - 6,
              left: 20,
              right: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: m.color,
                border: '2px solid var(--bg)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: 'var(--text-faint)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {m.label}
            </span>
          </div>
        ))}

        {isToday && (
          <div
            style={{
              position: 'absolute',
              left: 18,
              right: 0,
              top: nowY,
              borderTop: '2px solid var(--danger)',
              zIndex: 2,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: -18,
                top: -7,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: 'var(--danger)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
