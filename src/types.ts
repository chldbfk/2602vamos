/** 'sustained' = 시작·정지를 반복하다 별도로 완료 처리(지속형). 'completable' = 체크 한 번으로 즉시 완료(완료형). */
export type ProjectType = 'sustained' | 'completable'

export interface Project {
  id: string
  name: string
  color: string
  /** The one fixed, undeletable category ("미분류") every install gets — for things that don't
   *  fit a real category yet. Its name can still be edited, just not deleted. */
  isSystem?: boolean
  /** Soft-deleted: hidden from the active category list and new-task pickers, but the row
   *  (and its completed tasks) stays so historical records keep resolving name/color. */
  archived?: boolean
}

/** 매일/매주 반복. `interval` 1 = 매번, 2 = 격주(주 단위 기준)/이틀에 한 번(일 단위 기준) 같은 식. */
export interface RecurrenceRule {
  freq: 'daily' | 'weekly'
  interval: number
  daysOfWeek?: number[] // weekly 전용, 0=일 ~ 6=토
  endDate?: string // YYYY-MM-DD, 비어있으면 무기한
}

export interface TaskItem {
  id: string
  projectId: string
  title: string
  /** Set per task, not per project — a category can mix sustained and completable tasks. */
  type: ProjectType
  date: string // YYYY-MM-DD — start date
  endDate?: string // YYYY-MM-DD — for multi-day items; defaults to `date` when absent
  dueDate?: string // YYYY-MM-DD — optional deadline, independent of `date`/`endDate` placement
  memo?: string
  planStart?: string // "HH:mm" — placed in the PLAN column when set
  planEnd?: string
  done: boolean
  completedAt?: string // "HH:mm" — for completable tasks
  elapsedMinutes: number // accumulated tracked time, for sustained tasks
  isRunning: boolean
  runningStartedAt?: number // epoch ms
  /** Set when this row was auto-materialized from a recurring template — lets the reconciler
   *  avoid creating the same day's occurrence twice. */
  sourceTemplateId?: string
}

/** A reusable sub-task defined on the management page, not yet tied to a date. */
export interface TaskTemplate {
  id: string
  projectId: string
  title: string
  /** Set per template, not per project — chosen when the sub-task is added. */
  type: ProjectType
  dueDate?: string // YYYY-MM-DD — informational target date, shown on the management page
  memo?: string
  createdAt: number // epoch ms — for "생성일순" sorting
  /** When set, this template is a routine — the store keeps a rolling window of real TaskItem
   *  rows materialized ahead for its matching dates (see lib/recurrence.ts). */
  recurrence?: RecurrenceRule
  /** 지속형 전용 — "언제 할지" 계획한 시각. 템플릿이 실제 TaskItem으로 바뀔 때(불러오기/반복 생성)
   *  그대로 복사돼서 홈(일간)의 PLAN 배치, 리포트의 계획 막대에 자동으로 나타난다. */
  planStart?: string // "HH:mm"
  planEnd?: string
}

/** One tracked work session, recorded by real clock time so the day timeline can render it. */
export interface TimeLog {
  id: string
  taskId: string
  projectId: string
  date: string // YYYY-MM-DD — the day the session happened
  startMin: number // minutes since midnight, 0-1439
  endMin: number // minutes since midnight, startMin < endMin <= 1440
}

export interface DaySettings {
  wakeTime: string // "HH:mm" — start of the day timeline
  sleepTime: string // "HH:mm" — end of the day timeline; <= wakeTime means "after midnight"
}

export type UserRole = 'student' | 'worker' | 'jobseeker'

export interface UserProfile {
  nickname: string
  avatarEmoji: string
  role: UserRole
  field: string // 학과 / 진로 분야 — free text
  gender?: string
  age?: string
}

/** One reflection journal entry per date — the "성찰" feature from the plan. */
export interface ReflectionEntry {
  id: string
  date: string // YYYY-MM-DD, at most one entry per date
  text: string
  updatedAt: number
}

export interface AppData {
  projects: Project[]
  tasks: TaskItem[]
  templates: TaskTemplate[]
  timeLogs: TimeLog[]
  settings: DaySettings
  profile: UserProfile
  reflections: ReflectionEntry[]
}
