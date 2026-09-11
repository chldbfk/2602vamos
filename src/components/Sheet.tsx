import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'flex-end',
        background: 'rgba(15,15,20,0.4)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop"
        style={{
          width: '100%',
          maxHeight: '86%',
          overflowY: 'auto',
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '14px 20px calc(20px + env(safe-area-inset-bottom))',
          boxShadow: '0 -12px 32px rgba(23,23,28,0.16)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: 'var(--border)' }} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg)',
              border: 'none',
              borderRadius: 999,
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
