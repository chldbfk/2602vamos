import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { ChevronLeft, ChevronRight, Flame, Pause, Play, Plus, Settings2 } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { addDays, formatDateLabel, isToday, todayStr } from '../lib/date'
import { formatDurationMs } from '../lib/format'
import { computeStreak } from '../lib/streak'
import type { Project, TaskItem } from '../types'
import QuickAddSheet from '../components/QuickAddSheet'
import ScheduleSheet from '../components/ScheduleSheet'
import DayTimeline from '../components/DayTimeline'
import TimelineSettingsSheet from '../components/TimelineSettingsSheet'

function liveMsFor(t: TaskItem): number {
  if (t.isRunning && t.runningStartedAt) {
    return t.elapsedMinutes * 60000 + (Date.now() - t.runningStartedAt)
  }
  return t.elapsedMinutes * 60000
}

/** The right-side control on a PLAN card: a play/pause timer for sustained tasks, a checkbox for completable ones. */
function PlanControl({
  project,
  task,
  toggleDone,
  startTimer,
  stopTimer,
}: {
  project: Project
  task: TaskItem
  toggleDone: (id: string) => void
  startTimer: (id: string) => void
  stopTimer: (id: string) => void
}) {
  if (task.type === 'sustained') {
    const ms = liveMsFor(task)
    const complete = (e: MouseEvent) => {
      e.stopPropagation()
      if (task.isRunning) stopTimer(task.id) // stop & log whatever's running before marking done
      toggleDone(task.id)
    }

    if (task.done) {
      // finished — just the checkmark, nothing left to time
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <span
            role="button"
            onClick={complete}
            title="완료 취소"
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: project.color,
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>✓</span>
          </span>
          {ms > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: project.color, fontVariantNumeric: 'tabular-nums' }}>
              {formatDurationMs(ms)}
            </span>
          )}
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            role="button"
            onClick={complete}
            title="완료 체크"
            style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              borderRadius: 999,
              border: '1.5px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          />
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              if (task.isRunning) stopTimer(task.id)
              else startTimer(task.id)
            }}
            style={{
              width: 26,
              height: 26,
              flexShrink: 0,
              borderRadius: 999,
              background: task.isRunning ? '#ffece9' : project.color,
              color: task.isRunning ? '#ff4d4f' : '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            {task.isRunning ? (
              <Pause size={12} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={12} fill="currentColor" strokeWidth={0} />
            )}
          </span>
        </div>
        {ms > 0 && (
          <span style={{ fontSize: 9, fontWeight: 700, color: project.color, fontVariantNumeric: 'tabular-nums' }}>
            {formatDurationMs(ms)}
          </span>
        )}
      </div>
    )
  }

  return (
    <span
      role="button"
      onClick={(e) => {
        e.stopPropagation()
        toggleDone(task.id)
      }}
      title={task.done ? '완료 취소' : '완료 체크'}
      style={{
        width: 26,
        height: 26,
        flexShrink: 0,
        borderRadius: 999,
        border: `1.5px solid ${task.done ? project.color : 'var(--border)'}`,
        background: task.done ? project.color : 'transparent',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
      }}
    >
      {task.done && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
    </span>
  )
}

export default function MainScreen({ onOpenProfile }: { onOpenProfile: () => void }) {
  const {
    projects,
    tasks,
    templates,
    timeLogs,
    settings,
    updateSettings,
    profile,
    addTask,
    toggleDone,
    startTimer,
    stopTimer,
    schedule,
    unschedule,
  } = useAppStore()
  const [date, setDate] = useState(todayStr())
  const [showAdd, setShowAdd] = useState(false)
  const [scheduling, setScheduling] = useState<TaskItem | null>(null)
  const [showTimelineSettings, setShowTimelineSettings] = useState(false)
  const [tickCount, forceTick] = useState(0)

  const hasRunning = tasks.some((t) => t.isRunning)
  useEffect(() => {
    if (!hasRunning) return
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [hasRunning])

  const projectById = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p]))
    return map
  }, [projects])

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === date).sort((a, b) => (a.planStart ?? 'zz').localeCompare(b.planStart ?? 'zz')),
    [tasks, date],
  )
  const scheduled = dayTasks.filter((t) => t.planStart)
  const unscheduled = dayTasks.filter((t) => !t.planStart)

  const streak = useMemo(() => computeStreak(tasks), [tasks])

  const trackedMinutesToday = useMemo(
    () =>
      dayTasks.reduce((sum, t) => (t.type === 'sustained' ? sum + liveMsFor(t) / 60000 : sum), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tickCount drives the live re-render each second
    [dayTasks, tickCount],
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
              {isToday(date) ? '오늘' : ''}
            </div>
            <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800 }}>
              {formatDateLabel(date)}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#fff3e2',
                color: '#ff9500',
                borderRadius: 999,
                padding: '6px 12px 6px 10px',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              <Flame size={16} fill="#ff9500" strokeWidth={0} />
              {streak}
            </div>
            <button
              onClick={onOpenProfile}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: 'var(--brand-weak)',
                border: 'none',
                fontSize: 16,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              aria-label="프로필"
            >
              {profile.avatarEmoji}
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
          }}
        >
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            style={navBtnStyle}
            aria-label="전날"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setDate(todayStr())}
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--brand)',
              background: 'var(--brand-weak)',
              border: 'none',
              borderRadius: 999,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            오늘로
          </button>
          <button
            onClick={() => setDate((d) => addDays(d, 1))}
            style={navBtnStyle}
            aria-label="다음날"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day timeline | Plan split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: '0 20px 12px', gap: 10 }}>
        <div style={timelineColStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <ColHeader label="오늘 하루" sub={`${Math.round(trackedMinutesToday)}분 기록됨`} />
            <button
              onClick={() => setShowTimelineSettings(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                padding: 4,
              }}
              aria-label="하루 시간 범위 설정"
            >
              <Settings2 size={14} />
            </button>
          </div>
          <DayTimeline
            date={date}
            wakeTime={settings.wakeTime}
            sleepTime={settings.sleepTime}
            timeLogs={timeLogs}
            tasks={tasks}
            projectById={projectById}
          />
        </div>

        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />

        <div style={planColStyle}>
          <ColHeader label="PLAN" sub={`${scheduled.length}개 배치됨`} />
          <div className="no-scrollbar" style={colBodyStyle}>
            {scheduled.length === 0 && (
              <EmptyHint text={'관리 페이지에서 만든 할 일을\n시간대에 배치해보세요'} />
            )}
            {scheduled.map((t) => {
              const p = projectById.get(t.projectId)
              if (!p) return null
              return (
                <button
                  key={t.id}
                  onClick={() => setScheduling(t)}
                  style={{
                    ...planCardStyle,
                    borderLeft: `3px solid ${p.color}`,
                    opacity: t.done ? 0.55 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: p.color }}>
                      {t.planStart}
                      {t.planEnd ? `–${t.planEnd}` : ''}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        marginTop: 2,
                        textDecoration: t.done ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </div>
                  </div>
                  <PlanControl
                    project={p}
                    task={t}
                    toggleDone={toggleDone}
                    startTimer={startTimer}
                    stopTimer={stopTimer}
                  />
                </button>
              )
            })}

            {unscheduled.length > 0 && (
              <>
                <div style={{ fontSize: 10.5, color: 'var(--text-faint)', margin: '10px 2px 4px', fontWeight: 700 }}>
                  시간 미정
                </div>
                {unscheduled.map((t) => {
                  const p = projectById.get(t.projectId)
                  if (!p) return null
                  return (
                    <button
                      key={t.id}
                      onClick={() => setScheduling(t)}
                      style={{
                        ...planCardStyle,
                        borderLeft: `3px dashed ${p.color}`,
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: 10.5, color: p.color, marginTop: 2, fontWeight: 700 }}>
                          + 시간 배치
                        </div>
                      </div>
                      <PlanControl
                        project={p}
                        task={t}
                        toggleDone={toggleDone}
                        startTimer={startTimer}
                        stopTimer={stopTimer}
                      />
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowAdd(true)}
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
        aria-label="할 일 추가"
      >
        <Plus size={24} />
      </button>

      {showAdd && (
        <QuickAddSheet
          projects={projects.filter((p) => !p.archived)}
          templates={templates}
          onClose={() => setShowAdd(false)}
          onSubmit={(title, projectId, type, plan) => addTask(projectId, title, date, type, undefined, plan)}
        />
      )}
      {scheduling && (
        <ScheduleSheet
          task={scheduling}
          onClose={() => setScheduling(null)}
          onSave={(start, end) => schedule(scheduling.id, start, end)}
          onClear={() => unschedule(scheduling.id)}
        />
      )}
      {showTimelineSettings && (
        <TimelineSettingsSheet
          settings={settings}
          onClose={() => setShowTimelineSettings(false)}
          onSave={(next) => updateSettings(next)}
        />
      )}
    </div>
  )
}

function ColHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ padding: '2px 4px 8px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: 'var(--text)' }}>
        {label}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{sub}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        color: 'var(--text-faint)',
        textAlign: 'center',
        padding: '24px 6px',
        lineHeight: 1.6,
        whiteSpace: 'pre-line',
      }}
    >
      {text}
    </div>
  )
}

const navBtnStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  color: 'var(--text-muted)',
}

const colStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}

// PLAN gets a bit more room than the day timeline — its cards carry more text (time + title).
const planColStyle: CSSProperties = { ...colStyle, flex: 2 }
const timelineColStyle: CSSProperties = { ...colStyle, flex: 1 }

const colBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  paddingBottom: 80,
}

const planCardStyle: CSSProperties = {
  textAlign: 'left',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '8px 10px',
  cursor: 'pointer',
}
