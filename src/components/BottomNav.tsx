import { BarChart3, BookOpen, CalendarDays, Home, Settings2 } from 'lucide-react'

export type MainTab = 'home' | 'calendar' | 'report' | 'reflection' | 'manage'

const ITEMS: { key: MainTab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: '홈', icon: Home },
  { key: 'calendar', label: '캘린더', icon: CalendarDays },
  { key: 'report', label: '리포트', icon: BarChart3 },
  { key: 'reflection', label: '성찰', icon: BookOpen },
  { key: 'manage', label: '관리', icon: Settings2 },
]

export default function BottomNav({
  active,
  onChange,
}: {
  active: MainTab
  onChange: (tab: MainTab) => void
}) {
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        flexShrink: 0,
      }}
    >
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 0 6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--brand)' : 'var(--text-faint)',
              transition: 'color 0.15s ease',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
