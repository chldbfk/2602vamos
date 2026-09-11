import { useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { computeStreak } from '../lib/streak'
import { minutesToClock } from '../lib/date'
import type { UserRole } from '../types'

const AVATAR_OPTIONS = ['🙂', '🌱', '🔥', '⭐', '🐣', '🎯', '📚', '☕️']

const ROLE_LABEL: Record<UserRole, string> = {
  student: '대학생',
  worker: '직장인',
  jobseeker: '취준생',
}

export default function ProfileScreen({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const { profile, updateProfile, projects, tasks, timeLogs } = useAppStore()

  const streak = useMemo(() => computeStreak(tasks), [tasks])
  const totalTrackedMin = useMemo(
    () => Math.round(timeLogs.reduce((s, l) => s + (l.endMin - l.startMin), 0)),
    [timeLogs],
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px 8px', flexShrink: 0 }}>
        <button onClick={onBack} style={backBtn} aria-label="뒤로">
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>프로필</h1>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '10px 0 20px' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              background: 'var(--brand-weak)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 34,
            }}
          >
            {profile.avatarEmoji}
          </div>
          <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: '100%' }}>
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => updateProfile({ avatarEmoji: emoji })}
                style={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: 999,
                  border: emoji === profile.avatarEmoji ? '2px solid var(--brand)' : '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 15,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <StatTile label="연속 기록" value={`${streak}일`} />
          <StatTile label="프로젝트" value={`${projects.length}개`} />
          <StatTile label="누적 기록" value={minutesToClock(totalTrackedMin)} />
        </div>

        <Field label="닉네임">
          <input
            value={profile.nickname}
            onChange={(e) => updateProfile({ nickname: e.target.value })}
            placeholder="닉네임"
            style={inputStyle}
          />
        </Field>

        <Field label="신분">
          <div style={{ display: 'flex', gap: 8 }}>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => {
              const active = profile.role === role
              return (
                <button
                  key={role}
                  onClick={() => updateProfile({ role })}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 12,
                    border: active ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                    background: active ? 'var(--brand-weak)' : 'var(--surface)',
                    color: active ? 'var(--brand)' : 'var(--text-muted)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {ROLE_LABEL[role]}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="학과 · 진로 분야">
          <input
            value={profile.field}
            onChange={(e) => updateProfile({ field: e.target.value })}
            placeholder="예: 경영학과 · 창업 준비"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="성별 (선택)" style={{ flex: 1 }}>
            <input
              value={profile.gender ?? ''}
              onChange={(e) => updateProfile({ gender: e.target.value })}
              placeholder="선택 안 함"
              style={inputStyle}
            />
          </Field>
          <Field label="나이 (선택)" style={{ flex: 1 }}>
            <input
              value={profile.age ?? ''}
              onChange={(e) => updateProfile({ age: e.target.value })}
              placeholder="선택 안 함"
              style={inputStyle}
            />
          </Field>
        </div>

        <button
          onClick={() => {
            if (confirm('로그아웃할까요?')) onLogout()
          }}
          style={{
            marginTop: 24,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '13px 0',
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--danger)',
            cursor: 'pointer',
          }}
        >
          <LogOut size={15} /> 로그아웃
        </button>
      </div>
    </div>
  )
}

function Field({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '10px 6px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 3 }}>{value}</div>
    </div>
  )
}

const backBtn = {
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

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 13.5,
  outline: 'none',
  boxSizing: 'border-box',
}
