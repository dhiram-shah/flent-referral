'use client'

import { useEffect, useRef } from 'react'

interface Props {
  stat: string // e.g. "500+" or "1,200+"
}

export default function ReferralStatCounter({ stat }: Props) {
  const numRef = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  // Parse the numeric part and suffix (e.g. "500+" → [500, "+"])
  const match = stat.match(/^([\d,]+)(.*)$/)
  const target = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0
  const suffix = match ? match[2] : stat

  useEffect(() => {
    const el = numRef.current
    if (!el || !target) return

    el.textContent = '0' + suffix

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true
            const captured = el

            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                const duration = 1400
                const start = performance.now()

                function tick(now: number) {
                  const elapsed = now - start
                  const progress = Math.min(elapsed / duration, 1)
                  // Ease out quart
                  const eased = 1 - Math.pow(1 - progress, 4)
                  const current = Math.floor(eased * target)
                  captured.textContent = current.toLocaleString('en-IN') + suffix
                  if (progress < 1) requestAnimationFrame(tick)
                }

                requestAnimationFrame(tick)
              })
            )
          }
        })
      },
      { threshold: 0.4 }
    )

    observer.observe(el.closest('section')!)
    return () => observer.disconnect()
  }, [target, suffix])

  return (
    <span
      ref={numRef}
      suppressHydrationWarning
      className="serif"
      style={{
        fontSize: 'clamp(64px, 10vw, 96px)',
        fontWeight: 700,
        color: 'var(--brand)',
        lineHeight: 1,
        display: 'block',
      }}
    >
      {stat}
    </span>
  )
}
