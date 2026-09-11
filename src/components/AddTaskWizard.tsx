import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import Sheet from './Sheet'
import type { ProjectType } from '../types'

type Step = 1 | 2 | 3

/** 새 할 일 추가 — 투두메이트 스타일로 제목 → 유형 → (선택)마감일 순서로 한 단계씩 진행한다.
 *  세부 설정(메모·반복·예정 시간)은 만든 뒤 그 항목을 탭해서 여는 수정 화면 몫으로 남겨둔다. */
export default function AddTaskWizard({
  projectName,
  accentColor,
  onClose,
  onSubmit,
}: {
  projectName: string
  accentColor: string
  onClose: () => void
  onSubmit: (title: string, type: ProjectType, dueDate?: string) => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ProjectType>('completable')
  const [dueDate, setDueDate] = useState('')

  function finish() {
    onSubmit(title.trim(), type, dueDate || undefined)
    onClose()
  }

  return (
    <Sheet title={`${projectName} · 새 할 일`} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            style={{
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            <ChevronLeft size={15} /> 이전
          </button>
        )}
        <div style={{ display: 'flex', gap: 4, marginLeft: step > 1 ? 0 : 'auto', marginRight: 'auto' }}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              style={{
                width: n === step ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background: n <= step ? accentColor : 'var(--border)',
                transition: 'width 0.15s ease',
              }}
            />
          ))}
        </div>
        <div style={{ width: step > 1 ? 46 : 0 }} />
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>무엇을 할까요?</div>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim()) setStep(2)
              }}
              placeholder="예: 포핸드 30분 연습"
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '13px 14px',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>
          <button
            disabled={!title.trim()}
            onClick={() => setStep(2)}
            style={{
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
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            "{title}" — 어떤 방식으로 할까요?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(
              [
                { key: 'sustained' as const, label: '지속형', desc: '시작·정지 타이머로 시간을 기록해요' },
                { key: 'completable' as const, label: '완료형', desc: '체크 한 번으로 바로 끝나요' },
              ]
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setType(opt.key)
                  setStep(3)
                }}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: type === opt.key ? `1.5px solid ${accentColor}` : '1px solid var(--border)',
                  background: type === opt.key ? 'var(--brand-weak)' : 'var(--surface)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>마감일이 있나요?</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10 }}>
              없으면 비워두고 바로 추가해도 돼요
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
          <button
            onClick={finish}
            style={{
              background: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '15px 0',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {dueDate ? '마감일 설정하고 추가하기' : '마감일 없이 추가하기'}
          </button>
        </div>
      )}
    </Sheet>
  )
}
