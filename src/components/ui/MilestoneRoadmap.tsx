'use client'

import { useEffect, useRef } from 'react'

type Milestone = {
  id: string
  tierNumber: number
  referralsRequired: number
  rewardName: string
  rewardDescription?: string | null
}

const TIER_ACCENTS = ['#F5E6C8', '#FFD4C2', '#D4CCEF', '#B8EDE4', '#F5D370']
const GHOST_ICONS = [GhostGift, GhostFood, GhostEarbuds, GhostPlane, GhostPhone]

export function MilestoneRoadmap({ milestones }: { milestones: Milestone[] }) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Set the initial hidden state on each card via inline style
    // (avoids CSS-class race condition with Turbopack HMR / hydration)
    cardRefs.current.forEach((el) => {
      if (!el) return
      if (reduced) {
        el.style.opacity = '1'
        el.style.transform = 'none'
      } else {
        el.style.opacity = '0'
        el.style.transform = 'translateY(28px) scale(0.96)'
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.25s ease'
      }
    })

    if (reduced) {
      if (lineRef.current) lineRef.current.style.width = '100%'
      return
    }

    const section = sectionRef.current
    if (!section) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()

        // Double-RAF: ensures the browser has painted opacity:0 before starting
        requestAnimationFrame(() => requestAnimationFrame(() => {
          // Draw the track line
          if (lineRef.current) lineRef.current.style.width = '100%'

          // Stagger cards in
          cardRefs.current.forEach((el, i) => {
            if (!el) return
            const isGrand = el.dataset.grand === 'true'
            setTimeout(() => {
              el.style.opacity = '1'
              el.style.transform = 'none'
              // Glow pulse on grand prize card after it settles
              if (isGrand) {
                setTimeout(() => {
                  el.style.animation = 'ms-glow-pulse 2s ease-in-out 2'
                }, 600)
              }
            }, 120 + i * 160)
          })
        }))
      },
      { threshold: 0.08 }
    )
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.style.opacity !== '1') return // not yet animated in — skip
    el.style.transition = 'opacity 0.5s ease, transform 0.18s ease, box-shadow 0.18s ease'
    el.style.transform = 'translateY(-5px)'
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    el.style.transition = 'opacity 0.5s ease, transform 0.18s ease, box-shadow 0.18s ease'
    el.style.transform = 'none'
  }

  return (
    <section
      ref={sectionRef}
      style={{
        background: 'var(--brand)',
        padding: 'clamp(72px, 9vw, 112px) clamp(20px, 4vw, 32px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pattern overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/patterns/pie-factory.svg')",
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div
            style={{
              fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase' as const, letterSpacing: 3,
              marginBottom: 16,
            }}
          >
            Reward Journey
          </div>
          <h2
            className="serif-italic"
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 600, color: '#fff',
              marginBottom: 16, lineHeight: 1.1,
            }}
          >
            Every referral, a better reward
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, maxWidth: 460, margin: '0 auto', lineHeight: 1.75 }}>
            Build your streak. Each move-in unlocks the next tier — and the prizes keep getting better.
          </p>
        </div>

        {/* Progress track — hidden on mobile via CSS */}
        <div className="ms-track-wrap" style={{ position: 'relative', height: 2, marginBottom: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
          <div
            ref={lineRef}
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: '0%',
              background: 'linear-gradient(90deg, rgba(245,230,200,0.5) 0%, rgba(245,211,112,0.95) 100%)',
              borderRadius: 1,
              transition: 'width 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {/* Milestone cards */}
        <div className="milestone-grid">
          {milestones.map((m, i) => {
            const accent = TIER_ACCENTS[i] ?? '#F5E6C8'
            const GhostIcon = GHOST_ICONS[i] ?? GhostGift
            const isGrand = i === milestones.length - 1
            return (
              <div
                key={m.id}
                ref={(el) => { cardRefs.current[i] = el }}
                data-grand={isGrand ? 'true' : undefined}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                  background: accent,
                  borderRadius: 20,
                  padding: '28px 18px 24px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: isGrand ? '1.5px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isGrand
                    ? '0 0 48px rgba(245,211,112,0.2), 4px 4px 0 rgba(0,0,0,0.12)'
                    : '4px 4px 0 rgba(0,0,0,0.12)',
                  cursor: 'default',
                }}
              >
                {/* Ghost watermark icon — large, transparent, bottom-right */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: -12,
                    right: -10,
                    opacity: isGrand ? 0.09 : 0.08,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                >
                  <GhostIcon />
                </div>

                {/* Card content sits above the ghost */}
                <div style={{ position: 'relative', zIndex: 1 }}>

                  {/* Tier label */}
                  <div
                    style={{
                      fontSize: 9, fontWeight: 800,
                      color: 'rgba(21,16,46,0.38)',
                      textTransform: 'uppercase' as const, letterSpacing: 2,
                      marginBottom: 20,
                      textAlign: 'left',
                    }}
                  >
                    TIER {m.tierNumber}
                  </div>

                  {/* Grand prize badge */}
                  {isGrand && (
                    <div
                      style={{
                        position: 'absolute', top: 0, right: 0,
                        background: 'rgba(21,16,46,0.1)',
                        color: 'rgba(21,16,46,0.6)',
                        fontSize: 9, fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 999,
                        letterSpacing: 1,
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      Grand prize
                    </div>
                  )}

                  {/* Big referral count */}
                  <span
                    className="serif-italic"
                    style={{
                      fontSize: 'clamp(38px, 4.5vw, 54px)',
                      fontWeight: 700,
                      color: 'var(--brand)',
                      lineHeight: 1,
                      display: 'block',
                    }}
                  >
                    {m.referralsRequired}
                  </span>
                  <div
                    style={{
                      fontSize: 9, fontWeight: 800,
                      color: 'rgba(21,16,46,0.4)',
                      textTransform: 'uppercase' as const, letterSpacing: 2,
                      marginBottom: 14,
                    }}
                  >
                    {m.referralsRequired === 1 ? 'referral' : 'referrals'}
                  </div>

                  {/* Divider */}
                  <div style={{ width: 28, height: 1, background: 'rgba(21,16,46,0.12)', margin: '0 auto 14px' }} />

                  {/* Reward name */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand)', marginBottom: 6, lineHeight: 1.3 }}>
                    {m.rewardName}
                  </div>

                  {/* Description */}
                  {m.rewardDescription && (
                    <div style={{ fontSize: 11, color: 'rgba(21,16,46,0.5)', lineHeight: 1.55 }}>
                      {m.rewardDescription}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Streak note */}
        <p style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
          Streak resets only when you redeem — never for missing a month.
        </p>
      </div>
    </section>
  )
}

/* ── Ghost watermark icons — 88×88, thin stroke, brand navy ────────────── */

function GhostGift() {
  return (
    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10H20V20H4V10Z" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M12 10V20" stroke="#15102E" strokeWidth="0.75" strokeLinecap="round" />
      <path d="M4 10V7.5C4 6.67157 4.67157 6 5.5 6H18.5C19.3284 6 20 6.67157 20 7.5V10" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M12 6C12 4.89543 12.8954 4 14 4C15.6569 4 17 5.34315 17 7H12V6Z" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M12 6C12 4.89543 11.1046 4 10 4C8.34315 4 7 5.34315 7 7H12V6Z" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" />
    </svg>
  )
}

function GhostFood() {
  return (
    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3V8C8 9.65685 9.34315 11 11 11V21" stroke="#15102E" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3V11M11 3V11" stroke="#15102E" strokeWidth="0.75" strokeLinecap="round" />
      <path d="M16 3C16 3 18 5.5 18 8C18 10.5 16 11 16 11V21" stroke="#15102E" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GhostEarbuds() {
  return (
    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 12V10C7 8.34315 8.34315 7 10 7" stroke="#15102E" strokeWidth="0.75" strokeLinecap="round" />
      <path d="M17 12V10C17 8.34315 15.6569 7 14 7" stroke="#15102E" strokeWidth="0.75" strokeLinecap="round" />
      <path d="M6 12.5C6 11.6716 6.67157 11 7.5 11H8C8.82843 11 9.5 11.6716 9.5 12.5V15C9.5 15.8284 8.82843 16.5 8 16.5H7.5C6.67157 16.5 6 15.8284 6 15V12.5Z" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M14.5 12.5C14.5 11.6716 15.1716 11 16 11H16.5C17.3284 11 18 11.6716 18 12.5V15C18 15.8284 17.3284 16.5 16.5 16.5H16C15.1716 16.5 14.5 15.8284 14.5 15V12.5Z" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" />
    </svg>
  )
}

function GhostPlane() {
  return (
    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 13.5L21 9.5L10.5 5.5V9L4 7.5V11.5L10.5 10.1V13.5Z" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M10.5 13.5L8.5 20L11 18.8L13 22L15 21L13 17.5" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function GhostPhone() {
  return (
    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3.5H16C17.1046 3.5 18 4.39543 18 5.5V18.5C18 19.6046 17.1046 20.5 16 20.5H8C6.89543 20.5 6 19.6046 6 18.5V5.5C6 4.39543 6.89543 3.5 8 3.5Z" stroke="#15102E" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M10 6.5H14" stroke="#15102E" strokeWidth="0.75" strokeLinecap="round" />
      <path d="M12 18H12.01" stroke="#15102E" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
