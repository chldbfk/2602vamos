import { useState } from 'react'
import { CalendarCheck2, ClipboardList, Flame } from 'lucide-react'

const SLIDES = [
  {
    icon: ClipboardList,
    color: '#3182f6',
    bg: '#eaf2ff',
    title: '계획과 실천을\n한눈에 비교해요',
    desc: '전날 밤 세운 하루 계획(PLAN)과\n실제로 한 일(TO-DO)을 나란히 보면서\n얼마나 잘 지켰는지 확인해보세요.',
  },
  {
    icon: CalendarCheck2,
    color: '#8b5cf6',
    bg: '#f2edfe',
    title: '오늘 할 일과 일정,\n한 화면에서',
    desc: '프로젝트별 색상으로 구분된\n할 일과 스케줄을 캘린더에서\n바로 확인할 수 있어요.',
  },
  {
    icon: Flame,
    color: '#ff9500',
    bg: '#fff3e2',
    title: '기록이 쌓이면\nstreak가 됩니다',
    desc: '기록하기 귀찮은 날엔 AI가\n키워드만으로 성찰을 도와줘요.\n작은 꾸준함을 함께 만들어가요.',
  },
]

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1
  const Icon = slide.icon

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onDone}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 8,
          }}
        >
          건너뛰기
        </button>
      </div>

      <div
        key={step}
        className="animate-pop"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: 32,
            background: slide.bg,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon size={48} color={slide.color} strokeWidth={2} />
        </div>
        <div>
          <h1
            style={{
              fontSize: 23,
              fontWeight: 800,
              margin: '0 0 12px',
              whiteSpace: 'pre-line',
              lineHeight: 1.35,
            }}
          >
            {slide.title}
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: 'var(--text-muted)',
              whiteSpace: 'pre-line',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {slide.desc}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 4,
              background: i === step ? 'var(--brand)' : 'var(--border)',
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>

      <button
        onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
        style={{
          background: 'var(--brand)',
          color: '#fff',
          border: 'none',
          borderRadius: 16,
          padding: '16px 0',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(49,130,246,0.3)',
        }}
      >
        {isLast ? '시작하기' : '다음'}
      </button>
    </div>
  )
}
