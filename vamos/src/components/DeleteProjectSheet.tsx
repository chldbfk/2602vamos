import Sheet from './Sheet'

export default function DeleteProjectSheet({
  projectName,
  activeCount,
  completedCount,
  onClose,
  onKeepCompleted,
  onDeleteAll,
}: {
  projectName: string
  /** Not-yet-done tasks + reusable templates under this project — always removed either way. */
  activeCount: number
  /** Already-done tasks under this project — the thing the two choices disagree on. */
  completedCount: number
  onClose: () => void
  onKeepCompleted: () => void
  onDeleteAll: () => void
}) {
  return (
    <Sheet title={`'${projectName}' 삭제`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          진행 중인 할 일 {activeCount}개는 이 카테고리를 삭제하면 함께 사라져요.
          {completedCount > 0 && (
            <>
              {' '}
              이미 완료한 기록은 <strong style={{ color: 'var(--text)' }}>{completedCount}개</strong> 있어요 —
              이건 남길지 같이 지울지 골라주세요.
            </>
          )}
        </p>

        <button
          onClick={() => {
            onKeepCompleted()
            onClose()
          }}
          style={{
            textAlign: 'left',
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid var(--brand)',
            background: 'var(--brand-weak)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-strong)' }}>
            완료된 일은 보존
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            카테고리는 목록에서 사라지지만, 완료 기록은 관리 페이지의 '완료된 일' 탭에 그대로 남아요
          </div>
        </button>

        <button
          onClick={() => {
            onDeleteAll()
            onClose()
          }}
          style={{
            textAlign: 'left',
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid #ffd4d3',
            background: '#fff5f5',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>전체 삭제</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            완료 기록을 포함해 이 카테고리의 모든 할 일을 지워요
          </div>
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 0',
          }}
        >
          취소
        </button>
      </div>
    </Sheet>
  )
}
