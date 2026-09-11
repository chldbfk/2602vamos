import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { getMonthGrid, todayStr } from '../lib/date'
import { holidayName } from '../data/holidays'
import type { Project, TaskItem } from '../types'
import EventFormSheet from '../components/EventFormSheet'
import DayListSheet from '../components/DayListSheet'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface EventSpan {
  task: TaskItem
  project: Project
  startCol: number
  endCol: number // inclusive, 0-6 within the week
  continuesLeft: boolean
  continuesRight: boolean
}

interface Placement extends EventSpan {
  lane: number
}

/** Greedy interval packing: each event claims the first lane free since its start column. */
function packWeek(events: EventSpan[]): { placements: Placement[]; laneCount: number } {
  const sorted = [...events].sort(
    (a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol),
  )
  const laneEnds: number[] = []
  const placements: Placement[] = []
  for (const e of sorted) {
    let lane = laneEnds.findIndex((end) => end < e.startCol)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(e.endCol)
    } else {
      laneEnds[lane] = e.endCol
    }
    placements.push({ ...e, lane })
  }
  return { placements, laneCount: laneEnds.length }
}

export default function CalendarScreen() {
  const { projects, tasks, addTask, updateTask, deleteTask } = useAppStore()
  const today = todayStr()
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split('-').map(Number)
    return { y, m0: m - 1 }
  })
  const [dayListDate, setDayListDate] = useState<string | null>(null)
  const [formTask, setFormTask] = useState<TaskItem | 'new' | null>(null)
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>(undefined)

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const grid = useMemo(() => getMonthGrid(cursor.y, cursor.m0), [cursor])
  const indexByDate = useMemo(() => {
    const m = new Map<string, number>()
    grid.forEach((d, i) => m.set(d, i))
    return m
  }, [grid])

  const weeks = useMemo(() => {
    const chunks: string[][] = []
    for (let i = 0; i < grid.length; i += 7) chunks.push(grid.slice(i, i + 7))
    return chunks
  }, [grid])

  // Resolve every task to a [startIdx, endIdx] range in this month's 42-cell grid.
  const resolvedTasks = useMemo(() => {
    const out: { task: TaskItem; project: Project; startIdx: number; endIdx: number }[] = []
    for (const t of tasks) {
      const project = projectById.get(t.projectId)
      if (!project) continue
      const endDateStr = t.endDate ?? t.date
      let startIdx = indexByDate.get(t.date)
      let endIdx = indexByDate.get(endDateStr)
      if (startIdx === undefined && endIdx === undefined) continue // entirely outside this month's view
      if (startIdx === undefined) startIdx = 0 // started before the visible grid — clip
      if (endIdx === undefined) endIdx = grid.length - 1 // ends after the visible grid — clip
      if (endIdx < startIdx) continue
      out.push({ task: t, project, startIdx, endIdx })
    }
    return out
  }, [tasks, projectById, indexByDate, grid])

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m0 + delta, 1)
      return { y: d.getFullYear(), m0: d.getMonth() }
    })
  }

  function tasksForDate(dateStr: string): TaskItem[] {
    return tasks
      .filter((t) => t.date <= dateStr && (t.endDate ?? t.date) >= dateStr)
      .sort((a, b) => (a.planStart ?? 'zz').localeCompare(b.planStart ?? 'zz'))
  }

  function openNewEvent(defaultDate?: string) {
    setFormDefaultDate(defaultDate)
    setFormTask('new')
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '18px 16px 6px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => shiftMonth(-1)} style={navBtn} aria-label="이전 달">
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            {cursor.y}년 {cursor.m0 + 1}월
          </h1>
          <button onClick={() => shiftMonth(1)} style={navBtn} aria-label="다음 달">
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          className="no-scrollbar"
          style={{ display: 'flex', gap: 10, overflowX: 'auto', marginTop: 12 }}
        >
          {projects.filter((p) => !p.archived).map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: p.color }} />
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          columnGap: 3,
          padding: '10px 12px 4px',
          flexShrink: 0,
        }}
      >
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            style={{
              textAlign: 'center',
              fontSize: 10.5,
              fontWeight: 700,
              color: i === 0 ? 'var(--coral)' : i === 6 ? 'var(--brand)' : 'var(--text-faint)',
            }}
          >
            {w}
          </div>
        ))}
      </div>

      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '0 12px 90px', minHeight: 0 }}
      >
        {weeks.map((weekDates, wi) => {
          const weekStart = wi * 7
          const weekEnd = weekStart + 6

          const eventsThisWeek: EventSpan[] = resolvedTasks
            .filter((r) => r.startIdx <= weekEnd && r.endIdx >= weekStart)
            .map((r) => ({
              task: r.task,
              project: r.project,
              startCol: Math.max(r.startIdx, weekStart) - weekStart,
              endCol: Math.min(r.endIdx, weekEnd) - weekStart,
              continuesLeft: r.startIdx < weekStart,
              continuesRight: r.endIdx > weekEnd,
            }))

          const { placements, laneCount } = packWeek(eventsThisWeek)
          const laneRows: Placement[][] = Array.from({ length: laneCount }, () => [])
          placements.forEach((p) => laneRows[p.lane].push(p))

          return (
            <div key={wi} style={{ marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', columnGap: 3 }}>
                {weekDates.map((dateStr, ci) => {
                  const inMonth = Number(dateStr.split('-')[1]) - 1 === cursor.m0
                  const dayNum = Number(dateStr.split('-')[2])
                  const isTodayCell = dateStr === today
                  const holiday = holidayName(dateStr)
                  const weekdayColor =
                    ci === 0 || holiday ? 'var(--coral)' : ci === 6 ? 'var(--brand)' : 'var(--text)'
                  return (
                    <div key={dateStr} style={{ textAlign: 'center', opacity: inMonth ? 1 : 0.3 }}>
                      <button
                        onClick={() => setDayListDate(dateStr)}
                        style={{
                          display: 'inline-grid',
                          placeItems: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: isTodayCell ? 800 : 600,
                          color: isTodayCell ? '#fff' : weekdayColor,
                          background: isTodayCell ? 'var(--brand)' : 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {dayNum}
                      </button>
                      {holiday && (
                        <div
                          style={{
                            fontSize: 7.5,
                            fontWeight: 700,
                            color: 'var(--coral)',
                            marginTop: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {holiday}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {laneRows.map((row, li) => {
                const cells: ReactNode[] = []
                let col = 0
                while (col < 7) {
                  const hit = row.find((p) => p.startCol === col)
                  if (hit) {
                    const span = hit.endCol - hit.startCol + 1
                    cells.push(
                      <button
                        key={`${hit.task.id}-${col}`}
                        title={hit.task.title}
                        onClick={() => setFormTask(hit.task)}
                        style={{
                          gridColumn: `span ${span}`,
                          background: hit.project.color,
                          color: '#fff',
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '3px 6px',
                          borderRadius: 6,
                          borderTopLeftRadius: hit.continuesLeft ? 0 : 6,
                          borderBottomLeftRadius: hit.continuesLeft ? 0 : 6,
                          borderTopRightRadius: hit.continuesRight ? 0 : 6,
                          borderBottomRightRadius: hit.continuesRight ? 0 : 6,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textAlign: span > 1 ? 'center' : 'left',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: hit.task.done ? 0.5 : 1,
                        }}
                      >
                        {hit.task.title}
                      </button>,
                    )
                    col += span
                  } else {
                    cells.push(<div key={`empty-${li}-${col}`} />)
                    col += 1
                  }
                }
                return (
                  <div
                    key={li}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      columnGap: 3,
                      marginTop: 3,
                    }}
                  >
                    {cells}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => openNewEvent(today)}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 88,
          width: 52,
          height: 52,
          borderRadius: 999,
          background: 'var(--brand)',
          color: '#fff',
          border: 'none',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 10px 24px rgba(49,130,246,0.4)',
          cursor: 'pointer',
        }}
        aria-label="일정 추가"
      >
        <Plus size={24} />
      </button>

      {dayListDate && (
        <DayListSheet
          date={dayListDate}
          tasks={tasksForDate(dayListDate)}
          projectById={projectById}
          onClose={() => setDayListDate(null)}
          onSelectTask={(t) => {
            setDayListDate(null)
            setFormTask(t)
          }}
          onAdd={() => {
            const d = dayListDate
            setDayListDate(null)
            openNewEvent(d)
          }}
        />
      )}

      {formTask && (
        <EventFormSheet
          projects={projects}
          initial={formTask === 'new' ? undefined : formTask}
          defaultDate={formDefaultDate}
          onClose={() => setFormTask(null)}
          onSubmit={(title, projectId, startDate, endDate) => {
            if (formTask === 'new') {
              // Calendar-created events are date ranges, not timed sessions — default to 완료형.
              // (No type picker here yet; add one if 지속형 multi-day events turn out to matter.)
              addTask(projectId, title, startDate, 'completable', endDate)
            } else {
              updateTask(formTask.id, {
                title,
                projectId,
                date: startDate,
                endDate: endDate !== startDate ? endDate : undefined,
              })
            }
          }}
          onDelete={formTask !== 'new' ? (id) => deleteTask(id) : undefined}
        />
      )}
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
