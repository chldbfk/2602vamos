import type { CSSProperties } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_BY_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

/** A custom HH:mm picker (two <select>s) — unlike native <input type="time">, this guarantees
 *  only 5-minute increments are ever selectable, on every browser/platform. */
export default function TimePicker({
  value,
  onChange,
}: {
  value: string // "HH:mm"
  onChange: (next: string) => void
}) {
  const [hh, mm] = value.split(':')
  // if an existing value isn't on a 5-minute mark, round it down so the <select> has a valid match
  const roundedMm = MINUTES_BY_5.includes(mm) ? mm : String(Math.floor(Number(mm ?? 0) / 5) * 5).padStart(2, '0')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <select
        value={hh}
        onChange={(e) => onChange(`${e.target.value}:${roundedMm}`)}
        style={selectStyle}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span style={{ color: 'var(--text-faint)', fontWeight: 700 }}>:</span>
      <select
        value={roundedMm}
        onChange={(e) => onChange(`${hh}:${e.target.value}`)}
        style={selectStyle}
      >
        {MINUTES_BY_5.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}

const selectStyle: CSSProperties = {
  flex: 1,
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '11px 8px',
  fontSize: 15,
  fontVariantNumeric: 'tabular-nums',
  background: 'var(--surface)',
  color: 'var(--text)',
}
