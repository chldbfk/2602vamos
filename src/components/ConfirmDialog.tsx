/** A small centered "정말 삭제할까요?" popup — distinct from the bottom Sheet used everywhere
 *  else, since a quick yes/no confirmation reads better as a dialog than a sliding panel. */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = '삭제',
  onConfirm,
  onCancel,
}: {
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15,15,20,0.4)',
        padding: 32,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop"
        style={{
          width: '100%',
          maxWidth: 280,
          background: 'var(--surface)',
          borderRadius: 20,
          padding: '22px 20px 16px',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
        {description && (
          <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {description}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'var(--bg)',
              color: 'var(--text-muted)',
              border: 'none',
              borderRadius: 12,
              padding: '11px 0',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '11px 0',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
