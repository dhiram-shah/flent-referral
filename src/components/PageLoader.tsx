'use client'

import { useState, useEffect } from 'react'

function DotFlash({ delay }: { delay: string }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      background: 'var(--brand)',
      animation: `dot-flash 1.2s ${delay} infinite ease-in-out`,
    }} />
  )
}

function DogThinking() {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Thought bubble */}
      <div style={{ position: 'absolute', top: -4, right: -64, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <div style={{ display: 'flex', gap: 3, marginLeft: 10 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand)', opacity: 0.35 }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', opacity: 0.55 }} />
        </div>
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--brand)', borderRadius: 12, padding: '8px 12px', boxShadow: '2px 2px 0 var(--brand)', display: 'flex', gap: 5, alignItems: 'center' }}>
          <DotFlash delay="0s" />
          <DotFlash delay="0.2s" />
          <DotFlash delay="0.4s" />
        </div>
      </div>
      {/* Dog SVG */}
      <svg width="110" height="110" viewBox="0 0 100 100" fill="none" className="dog-bounce" aria-hidden="true">
        <ellipse cx="22" cy="50" rx="13" ry="19" transform="rotate(-12 22 50)" fill="#D4B896" stroke="var(--brand)" strokeWidth="1.8"/>
        <ellipse cx="78" cy="50" rx="13" ry="19" transform="rotate(12 78 50)" fill="#D4B896" stroke="var(--brand)" strokeWidth="1.8"/>
        <ellipse cx="22" cy="51" rx="7" ry="12" transform="rotate(-12 22 51)" fill="#F4B8B0" opacity="0.55"/>
        <ellipse cx="78" cy="51" rx="7" ry="12" transform="rotate(12 78 51)" fill="#F4B8B0" opacity="0.55"/>
        <circle cx="50" cy="54" r="36" fill="#E8D5B7" stroke="var(--brand)" strokeWidth="2"/>
        <ellipse cx="50" cy="68" rx="19" ry="13" fill="#F2E0CA"/>
        <circle cx="37" cy="50" r="7.5" fill="white" stroke="var(--brand)" strokeWidth="1.5"/>
        <circle cx="63" cy="50" r="7.5" fill="white" stroke="var(--brand)" strokeWidth="1.5"/>
        <circle cx="38.5" cy="50" r="4.5" fill="var(--brand)"/>
        <circle cx="64.5" cy="50" r="4.5" fill="var(--brand)"/>
        <circle cx="40.5" cy="47.5" r="1.5" fill="white"/>
        <circle cx="66.5" cy="47.5" r="1.5" fill="white"/>
        <ellipse cx="50" cy="63" rx="5.5" ry="3.5" fill="var(--brand)"/>
        <path d="M43 71 Q50 78 57 71" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <ellipse cx="27" cy="63" rx="6" ry="4" fill="#F4B8B0" opacity="0.5"/>
        <ellipse cx="73" cy="63" rx="6" ry="4" fill="#F4B8B0" opacity="0.5"/>
      </svg>
    </div>
  )
}

export function PageLoader({ messages }: { messages: string[] }) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % messages.length)
        setVisible(true)
      }, 300)
    }, 2800)
    return () => clearInterval(t)
  }, [messages.length])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 32, position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: "url('/patterns/pie-factory.svg')", backgroundSize: '60px 60px', backgroundRepeat: 'repeat', opacity: 0.04, pointerEvents: 'none' }} />
      <DogThinking />
      <p style={{ color: 'var(--brand)', fontSize: 15, fontWeight: 600, lineHeight: 1.6, margin: 0, maxWidth: 240, textAlign: 'center', transition: 'opacity 0.28s ease', opacity: visible ? 1 : 0, position: 'relative', zIndex: 1 }}>
        {messages[msgIdx]}
      </p>
    </div>
  )
}
