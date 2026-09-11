import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Sheet from './Sheet'
import type { Project, TaskItem } from '../types'
import { todayStr } from '../lib/date'

export default function EventFormSheet({
  projects,
  initial,
  defaultDate,
  onClose,
  onSubmit,
  onDelete,
}: {
  projects: Project[]
  /** Pass an existing task to edit it; omit to create a new one. */
  initial?: TaskItem
  defaultDate?: string
  onClose: () => void
  onSubmit: (title: string, projectId: string, startDate: string, endDate: string) => void
  onDelete?: (id: string) => void
}) {
  const fallbackDate = defaultDate ?? todayStr()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [projectId, setProjectId] = useState(initial?.projectId ?? projects[0]?.id ?? '')
  const [startDate, setStartDate] = useState(initial?.date ?? fallbackDate)
  const [endDate, setEndDate] = useState(initial?.endDate ?? initial?.date ?? fallbackDate)

  const invalidRange = endDate < startDate

  return (
    <Sheet title={initial ? '일정 수정' : '새 일정'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 수강신청"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '13px 14px',
            fontSize: 15,
            outline: 'none',
          }}
        />

        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
            프로젝트
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {projects.map((p) => {
              const active = p.id === projectId
              return (
                <button
                  key={p.id}
                  onClick={() => setProjectId(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: active ? `1.5px solid ${p.color}` : '1px solid var(--border)',
                    background: active ? `${p.color}1a` : 'var(--surface)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: active ? p.color : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: p.color,
                      display: 'inline-block',
                    }}
                  />
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>시작일</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (e.target.value > endDate) setEndDate(e.target.value)
              }}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '11px 10px',
                fontSize: 13.5,
              }}
            />
          </label>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>종료일</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '11px 10px',
                fontSize: 13.5,
              }}
            />
          </label>
        </div>
        {invalidRange && (
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--danger)' }}>
            종료일은 시작일보다 빠를 수 없어요.
          </p>
        )}

        <button
          disabled={!title.trim() || !projectId || invalidRange}
          onClick={() => {
            onSubmit(title.trim(), projectId, startDate, endDate)
            onClose()
          }}
          style={{
            marginTop: 4,
            background: title.trim() && !invalidRange ? 'var(--brand)' : 'var(--border)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: title.trim() && !invalidRange ? 'pointer' : 'default',
          }}
        >
          {initial ? '저장' : '추가하기'}
        </button>

        {initial && onDelete && (
          <button
            onClick={() => {
              if (confirm('이 일정을 삭제할까요?')) {
                onDelete(initial.id)
                onClose()
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <Trash2 size={14} /> 일정 삭제
          </button>
        )}
      </div>
    </Sheet>
  )
}
