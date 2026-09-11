import type { AppData, Project, TaskItem, TaskTemplate, TimeLog } from '../types'
import { addDays, todayStr } from '../lib/date'

export const PALETTE = [
  '#3182f6', // brand blue
  '#22c55e', // growth green
  '#ff6b6b', // coral
  '#ffb020', // amber
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#ec4899', // pink
]

export function createInitialData(): AppData {
  const projects: Project[] = [
    { id: 'p-study', name: '오픽 공부', color: '#3182f6' },
    { id: 'p-work', name: '팀플/과제', color: '#8b5cf6' },
    { id: 'p-life', name: '자기관리', color: '#22c55e' },
    { id: 'p-etc', name: '기타', color: '#ffb020' },
  ]

  const today = todayStr()
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)

  const tasks: TaskItem[] = [
    {
      id: 't1',
      projectId: 'p-study',
      title: '오픽 단어 암기 20개',
      type: 'sustained',
      date: today,
      planStart: '09:00',
      planEnd: '10:00',
      done: false,
      elapsedMinutes: 25,
      isRunning: false,
    },
    {
      id: 't2',
      projectId: 'p-work',
      title: '창업동아리 계획서 초안',
      type: 'sustained',
      date: today,
      planStart: '10:30',
      planEnd: '12:00',
      done: false,
      elapsedMinutes: 0,
      isRunning: false,
    },
    {
      id: 't3',
      projectId: 'p-life',
      title: '아침 스트레칭',
      type: 'completable',
      date: today,
      planStart: '08:00',
      planEnd: '08:20',
      done: true,
      completedAt: '08:19',
      elapsedMinutes: 0,
      isRunning: false,
      // Links this to the "아침 스트레칭" recurring template below (tpl4) so the daily
      // materializer sees today as already covered instead of creating a duplicate.
      sourceTemplateId: 'tpl4',
    },
    {
      id: 't4',
      projectId: 'p-etc',
      title: '장 보기',
      type: 'completable',
      date: today,
      done: false,
      elapsedMinutes: 0,
      isRunning: false,
    },
    {
      id: 't5',
      projectId: 'p-work',
      title: 'UI 레퍼런스 정리',
      type: 'sustained',
      date: yesterday,
      dueDate: today, // 완료된 일 아카이브에서 "기한내완료"로 보이는 예시
      planStart: '20:00',
      planEnd: '21:30',
      done: true,
      completedAt: '21:12',
      elapsedMinutes: 82,
      isRunning: false,
    },
    {
      id: 't6',
      projectId: 'p-study',
      title: '오픽 모의고사 1회',
      type: 'sustained',
      date: tomorrow,
      planStart: '19:00',
      planEnd: '20:30',
      done: false,
      elapsedMinutes: 0,
      isRunning: false,
    },
    {
      id: 't8',
      projectId: 'p-work',
      title: '수강신청',
      type: 'completable',
      date: today,
      endDate: addDays(today, 2),
      done: false,
      elapsedMinutes: 0,
      isRunning: false,
    },
    {
      id: 't9',
      projectId: 'p-etc',
      title: '2학기 등록',
      type: 'completable',
      date: addDays(today, 4),
      endDate: addDays(today, 9),
      done: false,
      elapsedMinutes: 0,
      isRunning: false,
    },
    {
      id: 't7',
      projectId: 'p-life',
      title: '오늘 성찰 일지 쓰기',
      type: 'completable',
      date: yesterday,
      dueDate: addDays(today, -2), // 완료된 일 아카이브에서 "기한초과완료"로 보이는 예시
      done: true,
      completedAt: '23:40',
      elapsedMinutes: 0,
      isRunning: false,
    },
  ]

  const now = Date.now()
  const daysAgo = (n: number) => now - n * 86400000

  // p-study mixes both types on purpose — a category isn't locked to one execution style.
  const templates: TaskTemplate[] = [
    {
      id: 'tpl1',
      projectId: 'p-study',
      title: '오픽 단어 20개 외우기',
      type: 'completable',
      createdAt: daysAgo(12),
    },
    {
      id: 'tpl2',
      projectId: 'p-study',
      title: '모의고사 1회 풀기',
      type: 'sustained',
      dueDate: addDays(today, 6),
      createdAt: daysAgo(9),
    },
    {
      id: 'tpl3',
      projectId: 'p-work',
      title: '주간 회의 정리',
      type: 'completable',
      memo: '지난주 액션아이템 먼저 확인',
      createdAt: daysAgo(5),
    },
    {
      id: 'tpl4',
      projectId: 'p-life',
      title: '아침 스트레칭',
      type: 'completable',
      createdAt: daysAgo(20),
      recurrence: { freq: 'daily', interval: 1 }, // 매일 반복 예시
    },
    { id: 'tpl5', projectId: 'p-life', title: '성찰 일지 쓰기', type: 'completable', createdAt: daysAgo(2) },
  ]

  // Seed a couple of past work sessions so the day timeline has something to show on first load.
  const timeLogs: TimeLog[] = [
    { id: 'log1', taskId: 't1', projectId: 'p-study', date: today, startMin: 9 * 60, endMin: 9 * 60 + 25 },
    {
      id: 'log2',
      taskId: 't5',
      projectId: 'p-work',
      date: yesterday,
      startMin: 20 * 60,
      endMin: 20 * 60 + 82,
    },
  ]

  return {
    projects,
    tasks,
    templates,
    timeLogs,
    settings: { wakeTime: '07:00', sleepTime: '00:00' },
    profile: {
      nickname: '유라',
      avatarEmoji: '🌱',
      role: 'student',
      field: '경영학과 · 창업 준비',
    },
    reflections: [],
  }
}
