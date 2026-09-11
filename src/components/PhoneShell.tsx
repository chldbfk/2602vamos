import type { ReactNode } from 'react'

// iPhone 17 (6.3", base model) logical viewport — 402×874 CSS px at the standard 3x scale.
const IPHONE_17_WIDTH = 402
const IPHONE_17_HEIGHT = 874

/**
 * Wraps the app so it previews like a mobile web page.
 * On a real narrow viewport it's edge-to-edge (the device already has this shape).
 * On a wider (desktop) viewport it's framed at the iPhone 17's exact aspect ratio
 * so the draft is reviewed at a realistic size and shape during vibe-coding.
 */
export default function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        background: '#eceef3',
      }}
    >
      <div
        className="phone-frame"
        style={{
          width: '100%',
          maxWidth: IPHONE_17_WIDTH,
          height: '100dvh',
          background: 'var(--bg)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
      <style>{`
        @media (min-width: ${IPHONE_17_WIDTH + 1}px) {
          .phone-frame {
            margin: 20px auto;
            width: auto !important;
            height: min(${IPHONE_17_HEIGHT}px, calc(100dvh - 40px)) !important;
            aspect-ratio: ${IPHONE_17_WIDTH} / ${IPHONE_17_HEIGHT};
            border-radius: 55px;
            box-shadow: 0 24px 60px rgba(23,23,28,0.18), 0 0 0 8px #0c0c10;
          }
        }
      `}</style>
    </div>
  )
}
