import { useState } from 'react'

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)

  function handleLogin(method: string) {
    setLoading(method)
    // draft only — no real auth backend yet
    setTimeout(() => onLogin(), 350)
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 28px 32px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #3182f6, #8b5cf6)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: 26,
            fontWeight: 800,
            boxShadow: '0 10px 24px rgba(49,130,246,0.35)',
          }}
        >
          V
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>바모스</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            계획, 실천, 성찰을 한 곳에서
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => handleLogin('kakao')}
          disabled={loading !== null}
          style={{
            background: '#fee500',
            color: '#191600',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading === 'kakao' ? '연결 중…' : '카카오로 시작하기'}
        </button>
        <button
          onClick={() => handleLogin('apple')}
          disabled={loading !== null}
          style={{
            background: '#111114',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading === 'apple' ? '연결 중…' : 'Apple로 시작하기'}
        </button>
        <button
          onClick={() => handleLogin('email')}
          disabled={loading !== null}
          style={{
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading === 'email' ? '연결 중…' : '이메일로 시작하기'}
        </button>
        <p
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: 'var(--text-faint)',
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          계속 진행 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
          <br />
          (초안 — 실제 로그인은 연결되어 있지 않습니다)
        </p>
      </div>
    </div>
  )
}
