import { useRef, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronDown, Clock, Plus, Repeat, StickyNote, Timer } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import ProjectManageScreen from './ProjectManageScreen'
import AddTaskWizard from '../components/AddTaskWizard'
import TemplateFormSheet from '../components/TemplateFormSheet'
import ConfirmDialog from '../components/ConfirmDialog'
import { describeRecurrence } from '../lib/recurrence'
import { formatDateLabel, todayStr } from '../lib/date'
import type { TaskItem, TaskTemplate } from '../types'

// Creating a new sub-task now always goes through AddTaskWizard — this sheet only edits
// an existing one, tapped from its row.
type EditingTemplate = { projectId: string; template: TaskTemplate }
type View = 'categories' | 'completed'
type SortMode = 'dueDate' | 'createdAt' | 'name'

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'dueDate', label: '마감일순' },
  { key: 'createdAt', label: '생성일순' },
  { key: 'name', label: '이름순' },
]

function sortTemplates(list: TaskTemplate[], mode: SortMode): TaskTemplate[] {
  const arr = [...list]
  if (mode === 'name') return arr.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  if (mode === 'createdAt') return arr.sort((a, b) => a.createdAt - b.createdAt)
  return arr.sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return a.createdAt - b.createdAt
  })
}

function dueBadge(t: TaskItem): { label: string; color: string; bg: string } {
  if (!t.dueDate) return { label: '기한없음', color: 'var(--text-faint)', bg: 'var(--bg)' }
  return t.date <= t.dueDate
    ? { label: '기한내완료', color: 'var(--growth)', bg: 'var(--growth-weak)' }
    : { label: '기한초과완료', color: 'var(--danger)', bg: '#fff1f0' }
}

export default function ManageScreen() {
  const { projects, tasks, templates, addTemplate, updateTemplate, deleteTemplate, toggleTemplateDoneToday } =
    useAppStore()

  // Archived projects are hidden here — their history still shows up in 완료 below.
  const activeProjects = projects.filter((p) => !p.archived)
  const projectById = new Map(projects.map((p) => [p.id, p]))

  const [view, setView] = useState<View>('categories')
  const [sortMode, setSortMode] = useState<SortMode>('dueDate')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  // A Set, not a single id — every project expands/collapses independently instead of
  // accordion-style (opening one used to close whatever else was open).
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(activeProjects[0] ? [activeProjects[0].id] : []),
  )
  function toggleExpanded(id: string) {
    setExpanded((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const [showProjectManage, setShowProjectManage] = useState(false)
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<EditingTemplate | null>(null)

  // Deleting a sub-task doesn't commit right away — it's hidden immediately, but only actually
  // removed after a few seconds, so "실행취소" has something real to undo instead of having to
  // reconstruct it from scratch.
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)
  const pendingDeleteTimeout = useRef<number | null>(null)

  function requestDeleteTemplate(t: TaskTemplate) {
    if (pendingDeleteTimeout.current !== null) {
      clearTimeout(pendingDeleteTimeout.current)
      if (pendingDelete) deleteTemplate(pendingDelete.id) // commit whatever was already pending
    }
    setPendingDelete({ id: t.id, title: t.title })
    pendingDeleteTimeout.current = window.setTimeout(() => {
      deleteTemplate(t.id)
      setPendingDelete(null)
      pendingDeleteTimeout.current = null
    }, 5000)
  }

  function undoDeleteTemplate() {
    if (pendingDeleteTimeout.current !== null) clearTimeout(pendingDeleteTimeout.current)
    pendingDeleteTimeout.current = null
    setPendingDelete(null)
  }

  // Long-press a sub-task row to delete it, instead of a trash icon sitting on every row.
  // longPressFired distinguishes "held long enough" from a normal tap, and also swallows the
  // click that fires right after the press is released, so it doesn't also open the edit sheet.
  const [confirmingDelete, setConfirmingDelete] = useState<TaskTemplate | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const longPressFired = useRef(false)

  // The timer only flips a flag — it never shows the dialog itself. The dialog opens from
  // onPointerUp instead, once the gesture is fully done, so nothing ever changes the DOM while
  // the pointer is still down (a covering dialog mid-gesture can make the eventual pointerup land
  // on the wrong element).
  function startLongPress() {
    longPressFired.current = false
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true
    }, 550)
  }
  function cancelLongPress() {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const today = todayStr()

  // A non-recurring sub-task is "done today" once its one-and-only linked instance is checked —
  // recurring ones (routines) never look done-forever this way, they just show today's checkmark.
  function isDoneToday(tpl: TaskTemplate): boolean {
    return tasks.some((t) => t.sourceTemplateId === tpl.id && t.date === today && t.done)
  }

  const completedByDate = (() => {
    const map = new Map<string, TaskItem[]>()
    for (const t of tasks) {
      if (!t.done) continue
      const list = map.get(t.date) ?? []
      list.push(t)
      map.set(t.date, list)
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? '')),
      }))
  })()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          padding: '18px 20px 12px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: -0.5, color: 'var(--text)' }}>
          관리
        </h1>
        {view === 'categories' && (
          <button
            onClick={() => setShowProjectManage(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '9px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Plus size={14} /> 프로젝트
          </button>
        )}
      </div>

      {/* Dark filled pill on a light track — same "월간/주간/일간" segmented-control look the
          rest of the app's timetable pages use, so 관리 reads as part of the same family. */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          margin: '0 20px 12px',
          padding: 3,
          background: 'var(--bg)',
          borderRadius: 999,
          width: 'fit-content',
          flexShrink: 0,
        }}
      >
        {(
          [
            { key: 'categories' as const, label: '관리' },
            { key: 'completed' as const, label: '완료' },
          ]
        ).map((tab) => {
          const active = view === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                border: 'none',
                background: active ? 'var(--text)' : 'transparent',
                color: active ? 'var(--surface)' : 'var(--text-muted)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {view === 'categories' ? (
        <>
          <div style={{ padding: '0 20px 10px', flexShrink: 0, position: 'relative' }}>
            <button
              onClick={() => setSortMenuOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              정렬 · {SORT_OPTIONS.find((o) => o.key === sortMode)?.label}
              <ChevronDown
                size={13}
                style={{ transform: sortMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
              />
            </button>

            {sortMenuOpen && (
              <>
                <div
                  onClick={() => setSortMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 20 }}
                />
                <div
                  className="animate-pop"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 20,
                    marginTop: 4,
                    zIndex: 21,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    minWidth: 132,
                  }}
                >
                  {SORT_OPTIONS.map((opt) => {
                    const active = sortMode === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortMode(opt.key)
                          setSortMenuOpen(false)
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          border: 'none',
                          background: active ? 'var(--brand-weak)' : 'transparent',
                          color: active ? 'var(--brand)' : 'var(--text)',
                          fontSize: 12.5,
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div
            className="no-scrollbar"
            style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 90px', minHeight: 0 }}
          >
            {activeProjects.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-faint)',
                  fontSize: 13,
                  padding: '52px 12px',
                  border: '1.5px dashed var(--border)',
                  borderRadius: 18,
                  lineHeight: 1.7,
                }}
              >
                아직 만든 카테고리가 없어요.
                <br />
                '프로젝트' 버튼으로 첫 프로젝트를 만들어보세요.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeProjects.map((p) => {
                const isOpen = expanded.has(p.id)
                const subTasks = sortTemplates(
                  templates.filter(
                    (t) =>
                      t.projectId === p.id &&
                      t.id !== pendingDelete?.id &&
                      (t.recurrence || !isDoneToday(t)),
                  ),
                  sortMode,
                )
                const sustainedCount = subTasks.filter((t) => t.type === 'sustained').length
                const completableCount = subTasks.length - sustainedCount
                return (
                  <div
                    key={p.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                      background: 'var(--surface)',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => toggleExpanded(p.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '13px 14px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: p.color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.name}
                          {p.isSystem && (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                color: 'var(--text-faint)',
                                background: 'var(--bg)',
                                borderRadius: 999,
                                padding: '1px 7px',
                              }}
                            >
                              기본
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>
                          {subTasks.length === 0
                            ? '할 일 없음'
                            : [
                                sustainedCount > 0 ? `⏱ 지속형 ${sustainedCount}` : null,
                                completableCount > 0 ? `✓ 완료형 ${completableCount}` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                        </div>
                      </div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setAddingFor(p.id)
                        }}
                        role="button"
                        aria-label={`${p.name}에 할 일 추가`}
                        style={{
                          width: 26,
                          height: 26,
                          flexShrink: 0,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 999,
                          background: 'var(--bg)',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} />
                      </span>
                      <ChevronDown
                        size={16}
                        style={{
                          color: 'var(--text-faint)',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </button>

                    {isOpen && (
                      <div
                        className="animate-pop"
                        style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}
                      >
                        {subTasks.length === 0 && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color: 'var(--text-faint)',
                              padding: '6px 2px 10px',
                            }}
                          >
                            아직 할 일이 없어요. 위의 + 버튼으로 추가해보세요.
                          </div>
                        )}

                        {subTasks.map((t) => {
                          const overdue = !!t.dueDate && t.dueDate < today
                          const done = isDoneToday(t)
                          return (
                            // A <div role="button">, not a <button> — it wraps its own checkbox
                            // <button> below, and a <button> can't validly contain another <button>.
                            // Tap opens the edit sheet; press and hold asks to delete instead. This is
                            // driven off pointerup, not click — the confirm dialog appears mid-gesture
                            // (covering the row before the finger/mouse lifts), and a plain click fired
                            // afterward would otherwise re-target to whatever's now on top. Pointer
                            // capture keeps every event of this gesture locked to this row regardless.
                            <div
                              key={t.id}
                              role="button"
                              tabIndex={0}
                              onPointerDown={(e) => {
                                // Not every pointer type/browser allows capture — never let a
                                // failure here skip starting the long-press timer.
                                try {
                                  e.currentTarget.setPointerCapture(e.pointerId)
                                } catch {
                                  /* no-op */
                                }
                                startLongPress()
                              }}
                              onPointerUp={(e) => {
                                try {
                                  e.currentTarget.releasePointerCapture(e.pointerId)
                                } catch {
                                  /* no-op */
                                }
                                cancelLongPress()
                                if (longPressFired.current) {
                                  longPressFired.current = false
                                  setConfirmingDelete(t) // held long enough — ask to delete instead
                                  return
                                }
                                setEditingTemplate({ projectId: p.id, template: t })
                              }}
                              onPointerLeave={cancelLongPress}
                              onPointerCancel={cancelLongPress}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setEditingTemplate({ projectId: p.id, template: t })
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'var(--bg)',
                                border: 'none',
                                borderRadius: 10,
                                padding: '8px 10px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                touchAction: 'manipulation',
                              }}
                            >
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={done ? '완료 취소' : '오늘 완료로 체크'}
                                onPointerDown={(e) => e.stopPropagation()}
                                onPointerUp={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleTemplateDoneToday(t.id)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    toggleTemplateDoneToday(t.id)
                                  }
                                }}
                                style={{
                                  width: 18,
                                  height: 18,
                                  flexShrink: 0,
                                  borderRadius: 999,
                                  border: done ? 'none' : '1.5px solid var(--border)',
                                  background: done ? p.color : 'transparent',
                                  display: 'grid',
                                  placeItems: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                {done && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                              </span>
                              <span
                                style={{
                                  width: 20,
                                  height: 20,
                                  flexShrink: 0,
                                  borderRadius: 999,
                                  background: `${p.color}1f`,
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                              >
                                {t.type === 'sustained' ? (
                                  <Timer size={11} style={{ color: p.color }} />
                                ) : (
                                  <CheckCircle2 size={11} style={{ color: p.color }} />
                                )}
                              </span>
                              <span
                                style={{
                                  flex: 1,
                                  fontSize: 12.5,
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {t.title}
                              </span>
                              {t.recurrence && (
                                <span title={describeRecurrence(t.recurrence)}>
                                  <Repeat size={12} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                                </span>
                              )}
                              {t.planStart && (
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    flexShrink: 0,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: p.color,
                                    background: 'var(--bg)',
                                    borderRadius: 999,
                                    padding: '2px 7px',
                                  }}
                                >
                                  <Clock size={10} />
                                  {t.planStart}
                                </span>
                              )}
                              {t.memo && (
                                <StickyNote size={12} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                              )}
                              {t.dueDate && (
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    flexShrink: 0,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: overdue ? 'var(--danger)' : 'var(--text-faint)',
                                    background: overdue ? '#fff1f0' : 'var(--surface)',
                                    border: `1px solid ${overdue ? '#ffd4d3' : 'var(--border)'}`,
                                    borderRadius: 999,
                                    padding: '2px 7px',
                                  }}
                                >
                                  <CalendarDays size={10} />
                                  {t.dueDate.slice(5).replace('-', '/')}
                                </span>
                              )}
                            </div>
                          )
                        })}

                        {subTasks.length > 0 && (
                          <div
                            style={{
                              fontSize: 10.5,
                              color: 'var(--text-faint)',
                              textAlign: 'center',
                              padding: '4px 2px 2px',
                            }}
                          >
                            꾹 누르면 삭제할 수 있어요
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div
          className="no-scrollbar"
          style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 90px', minHeight: 0 }}
        >
          {completedByDate.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-faint)',
                fontSize: 13,
                padding: '52px 12px',
                border: '1.5px dashed var(--border)',
                borderRadius: 18,
                lineHeight: 1.7,
              }}
            >
              아직 완료한 일이 없어요.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {completedByDate.map((group) => (
              <div key={group.date}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: -0.3,
                    color: 'var(--text)',
                    marginBottom: 8,
                    paddingLeft: 2,
                  }}
                >
                  {formatDateLabel(group.date)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.items.map((t) => {
                    const project = projectById.get(t.projectId)
                    const badge = dueBadge(t)
                    // A real hex, not the `var(--text-faint)` token — it gets a `NN` alpha suffix
                    // appended below, which only produces valid CSS for a literal hex color.
                    const color = project?.color ?? '#8286a3'
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: `${color}14`,
                          border: `1px solid ${color}33`,
                          borderRadius: 14,
                          padding: '10px 12px',
                        }}
                      >
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            flexShrink: 0,
                            borderRadius: 999,
                            background: color,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <CheckCircle2 size={13} style={{ color: '#fff' }} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>
                            {project?.name ?? '(삭제된 카테고리)'}
                            {project?.archived ? ' · 보관됨' : ''}
                            {t.completedAt ? ` · ${t.completedAt}` : ''}
                          </div>
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 10,
                            fontWeight: 700,
                            color: badge.color,
                            background: badge.bg,
                            borderRadius: 999,
                            padding: '3px 9px',
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title={`'${confirmingDelete.title}' 삭제할까요?`}
          description="삭제해도 잠깐은 실행취소할 수 있어요."
          onCancel={() => setConfirmingDelete(null)}
          onConfirm={() => {
            requestDeleteTemplate(confirmingDelete)
            setConfirmingDelete(null)
          }}
        />
      )}

      {pendingDelete && (
        <div
          className="animate-pop"
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 88,
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#20222e',
            color: '#fff',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 12.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            '{pendingDelete.title}' 삭제했어요
          </span>
          <button
            onClick={undoDeleteTemplate}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              color: '#8ab4ff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            실행취소
          </button>
        </div>
      )}

      {showProjectManage && <ProjectManageScreen onBack={() => setShowProjectManage(false)} />}

      {addingFor && (
        <AddTaskWizard
          projectName={activeProjects.find((p) => p.id === addingFor)?.name ?? ''}
          accentColor={activeProjects.find((p) => p.id === addingFor)?.color ?? 'var(--brand)'}
          onClose={() => setAddingFor(null)}
          onSubmit={(title, type, dueDate) => addTemplate(addingFor, title, type, { dueDate })}
        />
      )}

      {editingTemplate && (
        <TemplateFormSheet
          initial={editingTemplate.template}
          accentColor={
            activeProjects.find((p) => p.id === editingTemplate.projectId)?.color ?? 'var(--brand)'
          }
          onClose={() => setEditingTemplate(null)}
          onSubmit={(title, type, extra) => updateTemplate(editingTemplate.template.id, { title, type, ...extra })}
          onDelete={() => requestDeleteTemplate(editingTemplate.template)}
        />
      )}
    </div>
  )
}
