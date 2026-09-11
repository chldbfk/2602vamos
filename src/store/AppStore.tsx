import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AppData,
  DaySettings,
  Project,
  ProjectType,
  ReflectionEntry,
  TaskItem,
  TaskTemplate,
  TimeLog,
  UserProfile,
} from '../types'
import { createInitialData } from '../data/mock'
import { addDays, minutesSinceMidnight, nowHHmm, toDateStr, todayStr } from '../lib/date'
import { occurrencesInRange } from '../lib/recurrence'

const STORAGE_KEY = 'vamos.appdata.v1'
// How many days ahead a recurring template's real TaskItem rows get pre-created. Re-extends
// whenever a template's recurrence changes; doesn't auto-extend on its own while the app just
// sits open past this window — good enough for now, easy to add a daily re-check later.
const RECURRENCE_WINDOW_DAYS = 13

const DEFAULT_SETTINGS: DaySettings = { wakeTime: '07:00', sleepTime: '00:00' }
const DEFAULT_PROFILE: UserProfile = {
  nickname: '',
  avatarEmoji: '🙂',
  role: 'student',
  field: '',
}

/** Every install gets one fixed, undeletable "미분류" category for things that don't have a
 *  real category yet. Appended if a (fresh or returning) data set doesn't already have one. */
function ensureSystemProject(projects: Project[]): Project[] {
  if (projects.some((p) => p.isSystem)) return projects
  return [...projects, { id: 'p-uncategorized', name: '미분류', color: '#8b8a97', isSystem: true }]
}

function loadInitial(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      // Backfill any fields added to the schema after this data was saved, so an older
      // snapshot in a returning browser never crashes the app — it just starts those arrays empty.
      const parsed = JSON.parse(raw) as Partial<AppData>
      return materializeRecurringTasks({
        projects: ensureSystemProject(parsed.projects ?? []),
        tasks: parsed.tasks ?? [],
        // Older saves may predate `createdAt` — backfill so 생성일순 sorting never sees `undefined`.
        templates: (parsed.templates ?? []).map((t) => ({ ...t, createdAt: t.createdAt ?? Date.now() })),
        timeLogs: parsed.timeLogs ?? [],
        settings: parsed.settings ?? DEFAULT_SETTINGS,
        profile: parsed.profile ?? DEFAULT_PROFILE,
        reflections: parsed.reflections ?? [],
      })
    }
  } catch {
    // ignore corrupt storage and fall back to mock data
  }
  const fresh = createInitialData()
  return materializeRecurringTasks({ ...fresh, projects: ensureSystemProject(fresh.projects) })
}

/** Pre-creates real TaskItem rows for every recurring template's occurrences in the next
 *  `RECURRENCE_WINDOW_DAYS` days, skipping dates already materialized. Returns `d` unchanged
 *  (same reference) when there's nothing new, so callers can skip a re-render. */
function materializeRecurringTasks(d: AppData): AppData {
  const recurring = d.templates.filter((t) => t.recurrence)
  if (recurring.length === 0) return d

  const from = todayStr()
  const to = addDays(from, RECURRENCE_WINDOW_DAYS)
  const existingKeys = new Set(
    d.tasks.filter((t) => t.sourceTemplateId).map((t) => `${t.sourceTemplateId}|${t.date}`),
  )

  const newTasks: TaskItem[] = []
  for (const tpl of recurring) {
    const anchor = toDateStr(new Date(tpl.createdAt))
    for (const date of occurrencesInRange(tpl.recurrence!, anchor, from, to)) {
      const key = `${tpl.id}|${date}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      newTasks.push({
        id: uid('t'),
        projectId: tpl.projectId,
        title: tpl.title,
        type: tpl.type,
        date,
        planStart: tpl.planStart,
        planEnd: tpl.planEnd,
        done: false,
        elapsedMinutes: 0,
        isRunning: false,
        sourceTemplateId: tpl.id,
      })
    }
  }
  return newTasks.length > 0 ? { ...d, tasks: [...d.tasks, ...newTasks] } : d
}

interface AppStoreValue {
  projects: Project[]
  tasks: TaskItem[]
  templates: TaskTemplate[]
  timeLogs: TimeLog[]
  settings: DaySettings
  updateSettings: (patch: Partial<DaySettings>) => void
  profile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void
  reflections: ReflectionEntry[]
  saveReflection: (date: string, text: string) => void
  deleteReflection: (date: string) => void
  addProject: (name: string, color: string) => void
  updateProject: (id: string, patch: Partial<Omit<Project, 'id' | 'isSystem'>>) => void
  /** Hard delete — removes the project and every task/template/log tied to it, no matter its
   *  done state. No-ops on the fixed 미분류 category. */
  deleteProject: (id: string) => void
  /** Soft delete — keeps the project row and its already-done tasks (so history/report screens still
   *  resolve name & color), removes every not-yet-done task and all reusable templates, and hides the
   *  project from the active category list and new-task pickers via `archived: true`. No-ops on the
   *  fixed 미분류 category. */
  archiveProject: (id: string) => void
  addTask: (
    projectId: string,
    title: string,
    date: string,
    type: ProjectType,
    endDate?: string,
    extra?: Pick<TaskItem, 'dueDate' | 'memo' | 'planStart' | 'planEnd'>,
  ) => void
  updateTask: (id: string, patch: Partial<Omit<TaskItem, 'id'>>) => void
  deleteTask: (id: string) => void
  toggleDone: (id: string) => void
  startTimer: (id: string) => void
  stopTimer: (id: string) => void
  schedule: (id: string, planStart: string, planEnd?: string) => void
  unschedule: (id: string) => void
  addTemplate: (
    projectId: string,
    title: string,
    type: ProjectType,
    extra?: Pick<TaskTemplate, 'dueDate' | 'memo' | 'recurrence' | 'planStart' | 'planEnd'>,
  ) => void
  updateTemplate: (id: string, patch: Partial<Omit<TaskTemplate, 'id' | 'projectId' | 'createdAt'>>) => void
  /** Also removes this template's not-yet-done, today-or-later materialized occurrences — past or
   *  already-done ones are left alone as history. */
  deleteTemplate: (id: string) => void
  /** Checks a template off for today, right from the 관리 list — no need to go find it on the
   *  home screen first. Toggles today's already-materialized instance if one exists (recurring
   *  templates always have one within their rolling window); otherwise creates one, already done.
   *  Unchecking flips a `done` instance back to pending instead of deleting it. */
  toggleTemplateDoneToday: (templateId: string) => void
  importTemplate: (templateId: string, date: string) => void
  resetToSample: () => void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Stops a running task and returns its updated state plus the session log to record, if it was running. */
function stopAndLog(t: TaskItem, now: number): { task: TaskItem; log: TimeLog | null } {
  if (!t.isRunning) return { task: t, log: null }
  const startedAt = t.runningStartedAt ?? now
  const deltaMin = Math.max(1, Math.round((now - startedAt) / 60000))
  const startDate = new Date(startedAt)
  const startMin = minutesSinceMidnight(startDate)
  const log: TimeLog = {
    id: uid('log'),
    taskId: t.id,
    projectId: t.projectId,
    date: toDateStr(startDate),
    startMin,
    endMin: Math.min(1440, startMin + deltaMin),
  }
  return {
    task: {
      ...t,
      isRunning: false,
      runningStartedAt: undefined,
      elapsedMinutes: t.elapsedMinutes + deltaMin,
    },
    log,
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage may be unavailable (private mode) — draft still works in-memory
    }
  }, [data])

  const value = useMemo<AppStoreValue>(
    () => ({
      projects: data.projects,
      tasks: data.tasks,
      templates: data.templates,
      timeLogs: data.timeLogs,
      settings: data.settings,
      updateSettings: (patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      profile: data.profile,
      updateProfile: (patch) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch } })),
      reflections: data.reflections,
      saveReflection: (date, text) =>
        setData((d) => {
          const existing = d.reflections.find((r) => r.date === date)
          const updatedAt = Date.now()
          if (existing) {
            return {
              ...d,
              reflections: d.reflections.map((r) => (r.date === date ? { ...r, text, updatedAt } : r)),
            }
          }
          return { ...d, reflections: [...d.reflections, { id: uid('ref'), date, text, updatedAt }] }
        }),
      deleteReflection: (date) =>
        setData((d) => ({ ...d, reflections: d.reflections.filter((r) => r.date !== date) })),
      addProject: (name, color) =>
        setData((d) => ({
          ...d,
          projects: [...d.projects, { id: uid('p'), name, color }],
        })),
      updateProject: (id, patch) =>
        setData((d) => ({
          ...d,
          projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProject: (id) =>
        setData((d) => {
          if (d.projects.find((p) => p.id === id)?.isSystem) return d
          return {
            ...d,
            projects: d.projects.filter((p) => p.id !== id),
            tasks: d.tasks.filter((t) => t.projectId !== id),
            templates: d.templates.filter((tpl) => tpl.projectId !== id),
            timeLogs: d.timeLogs.filter((l) => l.projectId !== id),
          }
        }),
      archiveProject: (id) =>
        setData((d) => {
          if (d.projects.find((p) => p.id === id)?.isSystem) return d
          const keptTaskIds = new Set(
            d.tasks.filter((t) => t.projectId === id && t.done).map((t) => t.id),
          )
          return {
            ...d,
            projects: d.projects.map((p) => (p.id === id ? { ...p, archived: true } : p)),
            tasks: d.tasks.filter((t) => t.projectId !== id || t.done),
            templates: d.templates.filter((tpl) => tpl.projectId !== id),
            timeLogs: d.timeLogs.filter((l) => l.projectId !== id || keptTaskIds.has(l.taskId)),
          }
        }),
      addTask: (projectId, title, date, type, endDate, extra) =>
        setData((d) => ({
          ...d,
          tasks: [
            ...d.tasks,
            {
              id: uid('t'),
              projectId,
              title,
              type,
              date,
              endDate: endDate && endDate !== date ? endDate : undefined,
              done: false,
              elapsedMinutes: 0,
              isRunning: false,
              ...extra,
            },
          ],
        })),
      updateTask: (id, patch) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTask: (id) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.filter((t) => t.id !== id),
          timeLogs: d.timeLogs.filter((l) => l.taskId !== id),
        })),
      toggleDone: (id) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((t) => {
            if (t.id !== id) return t
            const done = !t.done
            return { ...t, done, completedAt: done ? nowHHmm() : undefined }
          }),
        })),
      toggleTemplateDoneToday: (templateId) =>
        setData((d) => {
          const today = todayStr()
          const existing = d.tasks.find((t) => t.sourceTemplateId === templateId && t.date === today)
          if (existing) {
            const done = !existing.done
            return {
              ...d,
              tasks: d.tasks.map((t) =>
                t.id === existing.id ? { ...t, done, completedAt: done ? nowHHmm() : undefined } : t,
              ),
            }
          }
          const tpl = d.templates.find((t) => t.id === templateId)
          if (!tpl) return d
          return {
            ...d,
            tasks: [
              ...d.tasks,
              {
                id: uid('t'),
                projectId: tpl.projectId,
                title: tpl.title,
                type: tpl.type,
                date: today,
                dueDate: tpl.dueDate,
                memo: tpl.memo,
                planStart: tpl.planStart,
                planEnd: tpl.planEnd,
                done: true,
                completedAt: nowHHmm(),
                elapsedMinutes: 0,
                isRunning: false,
                sourceTemplateId: tpl.id,
              },
            ],
          }
        }),
      // Only one task can run at a time — starting one auto-stops (and logs) whatever else was running,
      // so the day timeline never has to render overlapping sessions.
      startTimer: (id) =>
        setData((d) => {
          const now = Date.now()
          const logs: TimeLog[] = []
          const tasks = d.tasks.map((t) => {
            if (t.id === id) return { ...t, isRunning: true, runningStartedAt: now }
            if (t.isRunning) {
              const { task, log } = stopAndLog(t, now)
              if (log) logs.push(log)
              return task
            }
            return t
          })
          return { ...d, tasks, timeLogs: [...d.timeLogs, ...logs] }
        }),
      stopTimer: (id) =>
        setData((d) => {
          const now = Date.now()
          const logs: TimeLog[] = []
          const tasks = d.tasks.map((t) => {
            if (t.id !== id) return t
            const { task, log } = stopAndLog(t, now)
            if (log) logs.push(log)
            return task
          })
          return { ...d, tasks, timeLogs: [...d.timeLogs, ...logs] }
        }),
      schedule: (id, planStart, planEnd) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((t) => (t.id === id ? { ...t, planStart, planEnd: planEnd ?? undefined } : t)),
        })),
      unschedule: (id) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === id ? { ...t, planStart: undefined, planEnd: undefined } : t,
          ),
        })),
      addTemplate: (projectId, title, type, extra) =>
        setData((d) =>
          materializeRecurringTasks({
            ...d,
            templates: [
              ...d.templates,
              { id: uid('tpl'), projectId, title, type, createdAt: Date.now(), ...extra },
            ],
          }),
        ),
      // Also syncs this template's already-materialized, not-yet-done, today-or-later occurrences
      // to the new title/type/plan time — so editing a routine doesn't leave tomorrow's copy stale.
      // Past or already-done occurrences are left alone as history.
      updateTemplate: (id, patch) =>
        setData((d) => {
          const today = todayStr()
          const templates = d.templates.map((t) => (t.id === id ? { ...t, ...patch } : t))
          const tasks = d.tasks.map((t) => {
            if (t.sourceTemplateId !== id || t.done || t.date < today) return t
            return {
              ...t,
              title: patch.title ?? t.title,
              type: patch.type ?? t.type,
              planStart: 'planStart' in patch ? patch.planStart : t.planStart,
              planEnd: 'planEnd' in patch ? patch.planEnd : t.planEnd,
            }
          })
          return materializeRecurringTasks({ ...d, templates, tasks })
        }),
      deleteTemplate: (id) =>
        setData((d) => {
          const today = todayStr()
          return {
            ...d,
            templates: d.templates.filter((t) => t.id !== id),
            tasks: d.tasks.filter(
              (t) => !(t.sourceTemplateId === id && !t.done && t.date >= today),
            ),
          }
        }),
      importTemplate: (templateId, date) =>
        setData((d) => {
          const tpl = d.templates.find((t) => t.id === templateId)
          if (!tpl) return d
          return {
            ...d,
            tasks: [
              ...d.tasks,
              {
                id: uid('t'),
                projectId: tpl.projectId,
                title: tpl.title,
                type: tpl.type,
                date,
                dueDate: tpl.dueDate,
                memo: tpl.memo,
                planStart: tpl.planStart,
                planEnd: tpl.planEnd,
                done: false,
                elapsedMinutes: 0,
                isRunning: false,
              },
            ],
          }
        }),
      resetToSample: () => {
        const fresh = createInitialData()
        setData(materializeRecurringTasks({ ...fresh, projects: ensureSystemProject(fresh.projects) }))
      },
    }),
    [data],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
