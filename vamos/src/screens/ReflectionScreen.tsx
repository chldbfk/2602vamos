import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { addDays, formatDateLabel, minutesToClock, todayStr } from '../lib/date'
import { computeReflectionStreak } from '../lib/streak'

const KEYWORD_TEMPLATES = [
  (kw: string) => `오늘은 ${kw} 위주로 시간을 보냈다.`,
  (kw: string) => `${kw}에 신경 쓰다 보니 하루가 금방 지나갔다.`,
  (kw: string) => `${kw} 때문에 계획이 조금 흔들렸지만 나쁘지 않았다.`,
]

/** A rule-based placeholder for the "키워드만 넣으면 AI가 써준다" feature from the plan —
 *  wiring up a real model needs a backend call, so this just stands in for now. */
function draftFromKeywords(keywords: string, doneCount: number, trackedMin: number): string {
  const kw = keywords.trim() || '이런저런 일들'
  const opening = KEYWORD_TEMPLATES[kw.length % KEYWORD_TEMPLATES.length](kw)
  const parts = [opening]
  if (doneCount > 0) parts.push(`할 일은 ${doneCount}개 마무리했고,`)
  if (trackedMin > 0) parts.push(`총 ${minutesToClock(trackedMin)} 정도 집중해서 기록에 남았다.`)
  parts.push('내일은 계획한 시간대에 조금 더 맞춰서 움직여봐야겠다.')
  return parts.join(' ')
}

export default function ReflectionScreen() {
  const { tasks, reflections, saveReflection } = useAppStore()
  const [date, setDate] = useState(todayStr())
  const [text, setText] = useState('')
  const [keywords, setKeywords] = useState('')
  const [saved, setSaved] = useState(false)

  function goToDate(nextDate: string) {
    setDate(nextDate)
    setText(reflections.find((r) => r.date === nextDate)?.text ?? '')
    setKeywords('')
    setSaved(false)
  }

  const dayTasks = useMemo(() => tasks.filter((t) => t.date === date), [tasks, date])
  const doneCount = dayTasks.filter((t) => t.done).length
  const trackedMin = Math.round(dayTasks.reduce((s, t) => s + t.elapsedMinutes, 0))

  const streak = useMemo(() => computeReflectionStreak(reflections), [reflections])

  function handleSave() {
    saveReflection(date, text)
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '18px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>성찰</h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#fff3e2',
              color: '#ff9500',
              borderRadius: 999,
              padding: '6px 12px 6px 10px',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <Flame size={16} fill="#ff9500" strokeWidth={0} />
            {streak}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <button onClick={() => goToDate(addDays(date, -1))} style={navBtn} aria-label="전날">
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{formatDateLabel(date)}</span>
          <button onClick={() => goToDate(addDays(date, 1))} style={navBtn} aria-label="다음날">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 90px' }}>
        <div
          style={{
            background: 'var(--brand-weak)',
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: 12,
            color: 'var(--brand-strong)',
            marginBottom: 14,
          }}
        >
          이 날 할 일 {doneCount}개 완료 · {minutesToClock(trackedMin)} 기록됨
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            키워드만 적어도 초안을 만들어드려요
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="예: 집중 안 됨, 팀플, 뿌듯함"
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '11px 12px',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
            <button
              onClick={() => setText(draftFromKeywords(keywords, doneCount, trackedMin))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--violet)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '0 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={13} /> 초안 만들기
            </button>
          </div>
          <p style={{ margin: '6px 2px 0', fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
            지금은 키워드를 규칙대로 문장에 끼워 넣는 임시 기능이에요. 실제 AI가 써주는 건 백엔드 붙일 때
            추가할게요.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="오늘 하루는 어땠나요?"
          rows={10}
          style={{
            width: '100%',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 14,
            fontSize: 13.5,
            lineHeight: 1.7,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={handleSave}
          disabled={!text.trim()}
          style={{
            marginTop: 12,
            width: '100%',
            background: saved ? 'var(--growth)' : text.trim() ? 'var(--brand)' : 'var(--border)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '14px 0',
            fontSize: 14.5,
            fontWeight: 700,
            cursor: text.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s ease',
          }}
        >
          {saved ? '저장됐어요 ✓' : '저장'}
        </button>
      </div>
    </div>
  )
}

const navBtn = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  color: 'var(--text-muted)',
} as const
