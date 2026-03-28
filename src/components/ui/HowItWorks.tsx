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
  const sectionRef = useRef<HTMLDivElement>(null)
  const tapeBodyRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // IntersectionObserver for reliable step reveal
    const observers: IntersectionObserver[] = []
    stepRefs.current.forEach((el) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) el.classList.add('step-visible') },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })

    // Scroll-driven tape growth
    let rafId: number
    const updateTape = () => {
      if (!sectionRef.current || !tapeBodyRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const windowH = window.innerHeight
      const sectionH = sectionRef.current.offsetHeight
      const progress = Math.max(0, Math.min(1, (windowH - rect.top) / (sectionH * 0.88)))
      tapeBodyRef.current.style.transform = `scaleY(${progress})`
    }
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateTape)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    updateTape()

    return () => {
      observers.forEach((obs) => obs.disconnect())
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        padding: 'clamp(64px, 8vw, 96px) 20px clamp(80px, 10vw, 128px)',
        background: 'linear-gradient(180deg, #F5F1E9 0%, #EFE9DE 55%, #F3EDE3 100%)',
        borderTop: '1px solid rgba(21,16,46,0.10)',
        borderBottom: '1px solid rgba(21,16,46,0.10)',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ marginBottom: 72 }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: '#15102E', opacity: 0.45,
            textTransform: 'uppercase' as const, letterSpacing: 3,
            marginBottom: 16,
          }}>
            How it works
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 600,
              color: '#15102E',
              lineHeight: 1.1,
            }}
          >
            How <em style={{ fontStyle: 'italic' }}>Flent</em> Referrals Work
          </h2>
          <p style={{ color: 'rgba(21,16,46,0.68)', fontSize: 16, lineHeight: 1.8, maxWidth: 560, marginTop: 16 }}>
            A simple, trackable journey — built to feel private, premium, and worth sharing.
          </p>
        </div>

        {/* Tape + Steps */}
        <div className="timeline-steps-wrapper">

          {/* Measuring tape column — hidden on mobile */}
          <div className="timeline-tape-col">
            {/* Red square bobbin head */}
            <div style={{
              width: 36, height: 36,
              background: '#c64747',
              borderRadius: 6,
              border: '2px solid #15102E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0 #15102E',
              position: 'relative',
              zIndex: 2,
            }}>
              <div style={{
                width: 9, height: 9,
                borderRadius: '50%',
                background: '#15102E',
              }} />
            </div>

            {/* Tape body container — clips the growing tape */}
            <div style={{
              position: 'absolute',
              top: 36,
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 22,
              overflow: 'hidden',
            }}>
              <div
                ref={tapeBodyRef}
                style={{
                  width: '100%',
                  height: '100%',
                  transformOrigin: 'top center',
                  transform: 'scaleY(0)',
                  background: '#f5d9a8',
                  backgroundImage: [
                    'repeating-linear-gradient(to bottom, transparent 0px, transparent 9px, rgba(0,0,0,0.1) 9px, rgba(0,0,0,0.1) 10px)',
                    'repeating-linear-gradient(to right, transparent 0, transparent 14px, rgba(0,0,0,0.15) 14px, rgba(0,0,0,0.15) 22px)',
                  ].join(', '),
                  border: '1px solid #c9a040',
                  borderTop: 'none',
                }}
              />
            </div>
          </div>

          {/* Step cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                ref={(el) => { stepRefs.current[i] = el }}
                className="timeline-step"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#15102E', opacity: 0.45,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 3, marginBottom: 12,
                }}>
                  Step {step.number}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.78)',
                  borderRadius: 22,
                  padding: '34px 30px',
                  border: '1px solid rgba(21,16,46,0.12)',
                  boxShadow: '0 18px 48px rgba(24,41,61,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: step.accent,
                    }}
                  />
                  <h3 style={{
                    fontWeight: 600, fontSize: 20,
                    color: '#15102E', marginBottom: 12,
                    lineHeight: 1.3,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    color: 'rgba(21,16,46,0.7)',
                    fontSize: 15, lineHeight: 1.8,
                    marginBottom: 16,
                  }}>
                    {step.desc}
                  </p>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12, fontWeight: 700,
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
            ))}
          </div>
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
