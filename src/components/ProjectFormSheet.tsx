import { useState } from 'react'
import Sheet from './Sheet'
import { PALETTE } from '../data/mock'
import type { Project } from '../types'

export default function ProjectFormSheet({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: Project
  onClose: () => void
  onSubmit: (name: string, color: string) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PALETTE[0])

  return (
    <Sheet title={initial ? '프로젝트 수정' : '새 프로젝트'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 오픽 공부"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '13px 14px',
            fontSize: 15,
            outline: 'none',
          }}
        />

        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>색상</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: c,
                  border: c === color ? '2.5px solid var(--text)' : '2.5px solid transparent',
                  boxShadow: c === color ? 'none' : '0 0 0 1px var(--border)',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          지속형·완료형 같은 할 일 유형은 이 카테고리 안에서 할 일을 추가할 때 하나씩 정해요.
        </p>

        <button
          disabled={!name.trim()}
          onClick={() => {
            onSubmit(name.trim(), color)
            onClose()
          }}
          style={{
            marginTop: 4,
            background: name.trim() ? 'var(--brand)' : 'var(--border)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: name.trim() ? 'pointer' : 'default',
          }}
        >
          {initial ? '저장' : '만들기'}
        </button>
      </div>
    </Sheet>
  )
}
