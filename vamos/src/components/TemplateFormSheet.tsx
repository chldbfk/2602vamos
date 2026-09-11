import { useState } from 'react'
import { Clock, Trash2 } from 'lucide-react'
import Sheet from './Sheet'
import TypeToggle from './TypeToggle'
import TimePicker from './TimePicker'
import type { ProjectType, TaskTemplate } from '../types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type Freq = 'none' | 'daily' | 'weekly'
type TemplateExtra = Pick<
  TaskTemplate,
  'dueDate' | 'memo' | 'recurrence' | 'planStart' | 'planEnd'
>

export default function TemplateFormSheet({
  initial,
  accentColor,
  onClose,
  onSubmit,
  onDelete,
}: {
  initial?: TaskTemplate
  /** The parent project's color — used to tint the save button so it reads as "belongs to this category". */
  accentColor: string
  onClose: () => void
  onSubmit: (title: string, type: ProjectType, extra: TemplateExtra) => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState<ProjectType>(initial?.type ?? 'completable')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [planStart, setPlanStart] = useState(initial?.planStart ?? '')
  const [planEnd, setPlanEnd] = useState(initial?.planEnd ?? '')
  const [freq, setFreq] = useState<Freq>(initial?.recurrence?.freq ?? 'none')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initial?.recurrence?.daysOfWeek ?? [new Date().getDay()],
  )
  const [repeatEndDate, setRepeatEndDate] = useState(initial?.recurrence?.endDate ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function toggleDay(d: number) {
    setDaysOfWeek((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))
  }

  return (
    <Sheet title={initial ? '할 일 수정' : '새 할 일'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 포핸드 30분 연습"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '13px 14px',
            fontSize: 15,
            outline: 'none',
          }}
        />

        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>할 일 유형</div>
          <TypeToggle value={type} onChange={setType} />
        </div>

        {type === 'sustained' && (
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
              예정 시간 <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(선택)</span>
            </div>
            {planStart ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>시작</span>
                    <TimePicker value={planStart} onChange={setPlanStart} />
                  </label>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>종료</span>
                    <TimePicker value={planEnd || '10:00'} onChange={setPlanEnd} />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPlanStart('')
                    setPlanEnd('')
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 0',
                  }}
                >
                  시간 지우기
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPlanStart('09:00')
                  setPlanEnd('10:00')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Clock size={13} /> 시작·종료 시간 추가 — 홈 화면에 바로 배치돼요
              </button>
            )}
          </div>
        )}

        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>반복</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                { key: 'none' as const, label: '반복 없음' },
                { key: 'daily' as const, label: '매일' },
                { key: 'weekly' as const, label: '매주' },
              ]
            ).map((opt) => {
              const active = freq === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFreq(opt.key)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 10,
                    border: active ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                    background: active ? 'var(--brand-weak)' : 'var(--surface)',
                    color: active ? 'var(--brand)' : 'var(--text-muted)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {freq === 'weekly' && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {WEEKDAYS.map((label, i) => {
                const active = daysOfWeek.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    style={{
                      flex: 1,
                      height: 30,
                      borderRadius: 8,
                      border: active ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                      background: active ? 'var(--brand)' : 'var(--surface)',
                      color: active ? '#fff' : 'var(--text-muted)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {freq !== 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-faint)', flexShrink: 0 }}>
                종료일 (선택)
              </span>
              <input
                type="date"
                value={repeatEndDate}
                onChange={(e) => setRepeatEndDate(e.target.value)}
                style={{
                  flex: 1,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '7px 10px',
                  fontSize: 12.5,
                  outline: 'none',
                  color: repeatEndDate ? 'var(--text)' : 'var(--text-faint)',
                }}
              />
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
            마감일 <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(선택)</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '11px 12px',
                fontSize: 14,
                outline: 'none',
                color: dueDate ? 'var(--text)' : 'var(--text-faint)',
              }}
            />
            {dueDate && (
              <button
                onClick={() => setDueDate('')}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '0 14px',
                  background: 'var(--surface)',
                  color: 'var(--text-muted)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                지우기
              </button>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
            메모 <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(선택)</span>
          </div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="필요하면 짧게 적어두세요"
            rows={3}
            style={{
              width: '100%',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '11px 12px',
              fontSize: 13.5,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          disabled={!title.trim()}
          onClick={() => {
            const recurrence: TemplateExtra['recurrence'] =
              freq === 'none'
                ? undefined
                : {
                    freq,
                    interval: 1,
                    daysOfWeek: freq === 'weekly' ? daysOfWeek : undefined,
                    endDate: repeatEndDate || undefined,
                  }
            onSubmit(title.trim(), type, {
              dueDate: dueDate || undefined,
              memo: memo.trim() || undefined,
              recurrence,
              // Only sustained tasks carry a planned time range.
              planStart: type === 'sustained' ? planStart || undefined : undefined,
              planEnd: type === 'sustained' ? planEnd || undefined : undefined,
            })
            onClose()
          }}
          style={{
            marginTop: 4,
            background: title.trim() ? accentColor : 'var(--border)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: title.trim() ? 'pointer' : 'default',
          }}
        >
          {initial ? '저장' : '추가하기'}
        </button>

        {initial && onDelete && (
          <>
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 0',
                  alignSelf: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Trash2 size={13} /> 이 할 일 삭제
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  background: '#fff1f0',
                  borderRadius: 12,
                  padding: '10px 12px',
                  alignItems: 'center',
                }}
              >
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--danger)' }}>
                  정말 삭제할까요?
                </span>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 999,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    onClose()
                  }}
                  style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 999,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}
