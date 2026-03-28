'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
        background: scrolled ? 'rgba(252,251,247,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(21,16,46,0.08)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '0 32px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo pill — solid bg so it reads over the pattern/content */}
        <a href="https://flent.in" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          <div
            style={{
              background: 'var(--bg)',
              border: '1.5px solid var(--brand)',
              borderRadius: 999,
              padding: '7px 18px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <img src="/logo.png" alt="flent" style={{ height: 22, display: 'block' }} />
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" className="btn-pastel-peach" style={{ padding: '7px 18px', fontSize: 13 }}>
            Sign in
          </Link>
          <Link href="/signup" className="btn-pastel-violet" style={{ padding: '8px 20px', fontSize: 13 }}>
            Join — it&apos;s free
          </Link>
        </div>
      </div>
    </nav>
  )
}
