'use client'

import { useEffect, useRef } from 'react'

const STEPS = [
  {
    number: '01',
    title: 'Create your free account',
    desc: 'Sign up in under a minute and get a permanent referral code instantly. No approval, no waitlist, no fees. Just your unique link to share.',
    tag: '60 seconds to start',
    accent: '#C9B48A',
  },
  {
    number: '02',
    title: 'Share your code with friends',
    desc: "Send it to anyone moving to Bangalore — WhatsApp, Instagram, email. They enter your code when they enquire about a Flent home. First code entered wins.",
    tag: 'Share anywhere',
    accent: '#B9B0D8',
  },
  {
    number: '03',
    title: 'Unlock rewards as they move in',
    desc: 'When your friend signs an agreement and completes their first month, you hit a milestone and earn a reward. Build your streak — each level unlocks something better.',
    tag: 'Rewards stack, no cap',
    accent: '#D9B8B2',
  },
]

export function HowItWorks() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stepRefs.current.forEach((el) => { if (el) el.classList.add('hiw-visible') })
      return
    }

    const observers: IntersectionObserver[] = []
    stepRefs.current.forEach((el) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) el.classList.add('hiw-visible') },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((obs) => obs.disconnect())
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        padding: 'clamp(64px, 8vw, 96px) clamp(20px, 4vw, 48px) clamp(80px, 10vw, 128px)',
        background: 'linear-gradient(180deg, #F5F1E9 0%, #EFE9DE 55%, #F3EDE3 100%)',
        borderTop: '1px solid rgba(21,16,46,0.10)',
        borderBottom: '1px solid rgba(21,16,46,0.10)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ marginBottom: 80 }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: '#15102E', opacity: 0.45,
            textTransform: 'uppercase' as const, letterSpacing: 3,
            marginBottom: 16,
          }}>
            How it works
          </div>
          <h2
            className="serif-italic"
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 600,
              color: '#15102E',
              lineHeight: 1.1,
            }}
          >
            How Flent Referrals Work
          </h2>
          <p style={{
            color: 'rgba(21,16,46,0.68)',
            fontSize: 16,
            lineHeight: 1.8,
            maxWidth: 520,
            marginTop: 16,
          }}>
            A simple, trackable journey — built to feel private, premium, and worth sharing.
          </p>
        </div>

        {/* Steps */}
        <div>
          {STEPS.map((step, i) => {
            const isReversed = i % 2 === 1
            return (
              <div key={step.number}>
                {i > 0 && (
                  <div style={{ height: 1, background: 'rgba(21,16,46,0.10)' }} />
                )}
                <div
                  ref={(el) => { stepRefs.current[i] = el }}
                  className={`hiw-step${isReversed ? ' hiw-step-reverse' : ''}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  {/* Ghost number */}
                  <div className="hiw-step-num" aria-hidden="true">
                    <span
                      className="serif-italic"
                      style={{
                        fontSize: 'clamp(80px, 13vw, 180px)',
                        fontWeight: 600,
                        color: 'var(--brand)',
                        opacity: 0.08,
                        lineHeight: 1,
                        display: 'block',
                        userSelect: 'none' as const,
                        letterSpacing: -2,
                      }}
                    >
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="hiw-step-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                      {/* Neo-brutalist accent square */}
                      <div
                        aria-hidden="true"
                        style={{
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                          background: step.accent,
                          border: '1.5px solid var(--brand)',
                          boxShadow: '2px 2px 0 var(--brand)',
                        }}
                      />
                      <h3 style={{
                        fontWeight: 700,
                        fontSize: 'clamp(18px, 2.5vw, 22px)',
                        color: 'var(--brand)',
                        lineHeight: 1.2,
                        margin: 0,
                      }}>
                        {step.title}
                      </h3>
                    </div>
                    <p style={{
                      color: 'rgba(21,16,46,0.68)',
                      fontSize: 16,
                      lineHeight: 1.85,
                      marginBottom: 22,
                    }}>
                      {step.desc}
                    </p>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#15102E',
                      background: 'rgba(21,16,46,0.04)',
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: '1px solid rgba(21,16,46,0.10)',
                    }}>
                      <CheckIcon /> {step.tag}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17L4 12"
        stroke="#15102E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
