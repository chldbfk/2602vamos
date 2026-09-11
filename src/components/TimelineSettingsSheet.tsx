import { useState } from 'react'
import Sheet from './Sheet'
import TimePicker from './TimePicker'
import type { DaySettings } from '../types'

export default function TimelineSettingsSheet({
  settings,
  onClose,
  onSave,
}: {
  settings: DaySettings
  onClose: () => void
  onSave: (next: DaySettings) => void
}) {
  const [wakeTime, setWakeTime] = useState(settings.wakeTime)
  const [sleepTime, setSleepTime] = useState(settings.sleepTime)

  return (
    <Sheet title="하루 시간 범위 설정" onClose={onClose}>
      <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        "오늘 하루" 타임라인에 표시할 기상~취침 시간이에요. 취침 시간이 기상 시간보다 이르면 자정을
        넘긴 것으로 계산해요.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>기상 시간</span>
          <TimePicker value={wakeTime} onChange={setWakeTime} />
        </label>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>취침 시간</span>
          <TimePicker value={sleepTime} onChange={setSleepTime} />
        </label>
      </div>

      <button
        onClick={() => {
          onSave({ wakeTime, sleepTime })
          onClose()
        }}
        style={{
          background: 'var(--brand)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          padding: '15px 0',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        저장
      </button>
    </Sheet>
  )
}
