import { CheckCircle2, Timer } from 'lucide-react'
import type { ProjectType } from '../types'

const OPTIONS = [
  { key: 'sustained' as const, label: '지속형', desc: '시작·정지 타이머로 기록', Icon: Timer },
  { key: 'completable' as const, label: '완료형', desc: '체크 한 번으로 완료', Icon: CheckCircle2 },
]

/** The 지속형/완료형 picker — shared by every place a sub-task's execution style is chosen
 *  (management page template form, home screen quick-add, the management page's inline
 *  quick-add row). Kept as one component so the option styling only lives in one place.
 *  `compact` swaps the full description cards for a small icon+label segmented control,
 *  for tight inline rows where the full cards don't fit. */
export default function TypeToggle({
  value,
  onChange,
  compact = false,
}: {
  value: ProjectType
  onChange: (type: ProjectType) => void
  compact?: boolean
}) {
  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 10, padding: 3 }}>
        {OPTIONS.map((opt) => {
          const active = value === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 9px',
                borderRadius: 7,
                border: 'none',
                background: active ? 'var(--surface)' : 'transparent',
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
                color: active ? 'var(--brand)' : 'var(--text-faint)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <opt.Icon size={11} />
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {OPTIONS.map((opt) => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              flex: 1,
              textAlign: 'left',
              padding: '11px 12px',
              borderRadius: 12,
              border: active ? '1.5px solid var(--brand)' : '1px solid var(--border)',
              background: active ? 'var(--brand-weak)' : 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: active ? 'var(--brand)' : 'var(--text)',
              }}
            >
              {opt.label}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 2 }}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )
}
