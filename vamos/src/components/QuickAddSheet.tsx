import { useState } from 'react'
import { Clock } from 'lucide-react'
import Sheet from './Sheet'
import TypeToggle from './TypeToggle'
import type { Project, ProjectType, TaskItem, TaskTemplate } from '../types'

type CarriedPlan = Pick<TaskItem, 'dueDate' | 'memo' | 'planStart' | 'planEnd'>

export default function QuickAddSheet({
  projects,
  templates = [],
  defaultProjectId,
  onClose,
  onSubmit,
}: {
  projects: Project[]
  templates?: TaskTemplate[]
  defaultProjectId?: string
  onClose: () => void
  onSubmit: (title: string, projectId: string, type: ProjectType, plan: CarriedPlan) => void
}) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? '')
  const [type, setType] = useState<ProjectType>('completable')
  // Set when a "관리 페이지에서 불러오기" chip is picked — carried through to the created task as-is.
  const [carriedPlan, setCarriedPlan] = useState<CarriedPlan>({})
  const projectById = new Map(projects.map((p) => [p.id, p]))

  return (
    <Sheet title="할 일 추가" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {templates.length > 0 && (
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
              관리 페이지에서 불러오기
            </div>
            <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {templates.map((tpl) => {
                const p = projectById.get(tpl.projectId)
                return (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setTitle(tpl.title)
                      setProjectId(tpl.projectId)
                      setType(tpl.type)
                      setCarriedPlan({
                        dueDate: tpl.dueDate,
                        memo: tpl.memo,
                        planStart: tpl.planStart,
                        planEnd: tpl.planEnd,
                      })
                    }}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 11px',
                      borderRadius: 999,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: p?.color ?? 'var(--text-faint)',
                        display: 'inline-block',
                      }}
                    />
                    {tpl.title}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 오픽 단어 20개 외우기"
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

        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>할 일 유형</div>
          <TypeToggle value={type} onChange={setType} />
        </div>

        {type === 'sustained' && carriedPlan.planStart && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: 'var(--text-muted)',
              background: 'var(--bg)',
              borderRadius: 10,
              padding: '8px 10px',
            }}
          >
            <Clock size={13} style={{ flexShrink: 0 }} />
            관리 페이지에서 정한 예정 시간 {carriedPlan.planStart}–{carriedPlan.planEnd}로 바로
            배치돼요
          </div>
        )}

        <button
          disabled={!title.trim() || !projectId}
          onClick={() => {
            onSubmit(title.trim(), projectId, type, type === 'sustained' ? carriedPlan : { dueDate: carriedPlan.dueDate, memo: carriedPlan.memo })
            onClose()
          }}
          style={{
            marginTop: 4,
            background: title.trim() ? 'var(--brand)' : 'var(--border)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: title.trim() ? 'pointer' : 'default',
          }}
        >
          추가하기
        </button>
      </div>
    </Sheet>
  )
}
