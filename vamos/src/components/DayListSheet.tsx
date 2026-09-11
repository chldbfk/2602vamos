import { Plus } from 'lucide-react'
import Sheet from './Sheet'
import { formatDateLabel } from '../lib/date'
import type { Project, TaskItem } from '../types'

export default function DayListSheet({
  date,
  tasks,
  projectById,
  onClose,
  onSelectTask,
  onAdd,
}: {
  date: string
  tasks: TaskItem[]
  projectById: Map<string, Project>
  onClose: () => void
  onSelectTask: (task: TaskItem) => void
  onAdd: () => void
}) {
  return (
    <Sheet title={formatDateLabel(date)} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {tasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 12.5,
              color: 'var(--text-faint)',
              padding: '20px 0',
            }}
          >
            이 날은 등록된 일정이 없어요
          </div>
        )}
        {tasks.map((t) => {
          const p = projectById.get(t.projectId)
          if (!p) return null
          return (
            <button
              key={t.id}
              onClick={() => onSelectTask(t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 12px',
                cursor: 'pointer',
              }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: 999, background: p.color, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: t.done ? 'line-through' : 'none',
                    color: t.done ? 'var(--text-faint)' : 'var(--text)',
                  }}
                >
                  {t.title}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>
                  {p.name}
                  {t.planStart ? ` · ${t.planStart}${t.planEnd ? `–${t.planEnd}` : ''}` : ''}
                  {t.endDate && t.endDate !== t.date ? ` · ${t.date} ~ ${t.endDate}` : ''}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={onAdd}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: 'var(--brand-weak)',
          color: 'var(--brand)',
          border: 'none',
          borderRadius: 14,
          padding: '13px 0',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <Plus size={16} /> 이 날 일정 추가
      </button>
    </Sheet>
  )
}
