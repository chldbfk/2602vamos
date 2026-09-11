import { useState } from 'react'
import Sheet from './Sheet'
import TimePicker from './TimePicker'
import type { TaskItem } from '../types'

export default function ScheduleSheet({
  task,
  onClose,
  onSave,
  onClear,
}: {
  task: TaskItem
  onClose: () => void
  onSave: (start: string, end?: string) => void
  onClear: () => void
}) {
  const [start, setStart] = useState(task.planStart ?? '09:00')
  const [end, setEnd] = useState(task.planEnd ?? '10:00')
  // 'completable' asks for a single execution time; 'sustained' asks for a start–end range.
  const isOneOff = task.type === 'completable'

  return (
    <Sheet title="시간대 배치" onClose={onClose}>
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {task.title}
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {isOneOff ? '실행 시간' : '시작'}
          </span>
          <TimePicker value={start} onChange={setStart} />
        </label>
        {!isOneOff && (
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>종료</span>
            <TimePicker value={end} onChange={setEnd} />
          </label>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {task.planStart && (
          <button
            onClick={() => {
              onClear()
              onClose()
            }}
            style={{
              flex: 1,
              background: 'var(--bg)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 0',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            배치 해제
          </button>
        )}
        <button
          onClick={() => {
            onSave(start, isOneOff ? undefined : end)
            onClose()
          }}
          style={{
            flex: 2,
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '14px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          저장
        </button>
      </div>
    </Sheet>
  )
}
