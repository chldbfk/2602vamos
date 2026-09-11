import { useLayoutEffect, useRef, useState } from 'react'
import { clampRange, type Interval } from '../lib/dayRange'

const MIN_PX_PER_MIN = 0.4

export interface ColoredInterval extends Interval {
  color: string
  label: string
  live?: boolean
}

function Track({
  intervals,
  hours,
  rangeStart,
  rangeEnd,
  pxPerMin,
  totalPx,
  isToday,
  nowY,
}: {
  intervals: ColoredInterval[]
  hours: number[]
  rangeStart: number
  rangeEnd: number
  pxPerMin: number
  totalPx: number
  isToday: boolean
  nowY: number
}) {
  return (
    <div style={{ position: 'relative', flex: 1, height: totalPx }}>
      {hours.map((h) => (
        <div
          key={h}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: (h - rangeStart) * pxPerMin,
            borderTop: '1px dashed var(--border)',
          }}
        />
      ))}
      {intervals.map((iv, i) => {
        const s = clampRange(iv.start, rangeStart, rangeEnd)
        const e = clampRange(iv.end, rangeStart, rangeEnd)
        const top = (s - rangeStart) * pxPerMin
        const height = Math.max(4, (e - s) * pxPerMin)
        return (
          <div
            key={`${iv.label}-${i}`}
            title={iv.label}
            style={{
              position: 'absolute',
              top,
              height,
              left: 2,
              right: 2,
              background: iv.color,
              borderRadius: 4,
              boxShadow: iv.live ? 'inset 0 0 0 2px rgba(255,255,255,0.7)' : 'none',
            }}
          />
        )
      })}
      {isToday && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: nowY,
            borderTop: '1.5px solid var(--danger)',
          }}
        />
      )}
    </div>
  )
}

/** Two parallel vertical bars (계획 vs 실제) sharing one hour axis, so a mismatch is visible at a glance. */
export default function PlanVsActualBars({
  rangeStart,
  rangeEnd,
  nowInRange,
  isToday,
  planned,
  actual,
}: {
  rangeStart: number
  rangeEnd: number
  nowInRange: number
  isToday: boolean
  planned: ColoredInterval[]
  actual: ColoredInterval[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)

  const totalMin = Math.max(1, rangeEnd - rangeStart)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerHeight(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pxPerMin = Math.max(MIN_PX_PER_MIN, containerHeight > 0 ? containerHeight / totalMin : 0)
  const totalPx = Math.max(containerHeight, totalMin * MIN_PX_PER_MIN)

  const hours: number[] = []
  for (let h = Math.ceil(rangeStart / 60) * 60; h <= rangeEnd; h += 60) hours.push(h)

  const nowY = (clampRange(nowInRange, rangeStart, rangeEnd) - rangeStart) * pxPerMin
  const trackProps = { hours, rangeStart, rangeEnd, pxPerMin, totalPx, isToday, nowY }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 8, padding: '0 2px 4px', flexShrink: 0 }}>
        <div style={{ width: 26, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>
          계획
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>
          실제
        </div>
      </div>
      <div ref={containerRef} className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 8, margin: '0 2px 6px' }}>
          <div style={{ width: 26, flexShrink: 0, position: 'relative', height: totalPx }}>
            {hours.map((h) => (
              <span
                key={h}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: (h - rangeStart) * pxPerMin - 6,
                  fontSize: 9,
                  color: 'var(--text-faint)',
                }}
              >
                {Math.round(h / 60) % 24}
              </span>
            ))}
          </div>
          <Track intervals={planned} {...trackProps} />
          <Track intervals={actual} {...trackProps} />
        </div>
      </div>
    </div>
  )
}
