'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Pattern overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/patterns/pie-factory.svg')",
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          opacity: 0.05,
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <div style={{ background: 'var(--bg)', border: '1.5px solid var(--brand)', borderRadius: 999, padding: '7px 18px', display: 'inline-flex', alignItems: 'center' }}>
              <img src="/assets/flent-logo.png" alt="Flent" style={{ height: 22, display: 'block' }} />
            </div>
          </Link>
          <p style={{ color: 'rgba(21,16,46,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginTop: 12 }}>Admin Portal</p>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '36px 32px', border: '1.5px solid var(--brand)', boxShadow: '4px 4px 0 var(--brand)' }}>
          <h1 className="serif-italic" style={{ fontWeight: 600, fontSize: 28, marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
            Sign in to manage the referral program.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                Email address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                autoFocus
                placeholder="demand@flent.in"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-base btn-pill"
              style={{ width: '100%', marginTop: 4, padding: '13px', fontSize: 15, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
          Looking for the referral program?{' '}
          <Link href="/" style={{ color: 'var(--brand)', fontWeight: 600 }}>
            Go to homepage
          </Link>
        </p>
      </div>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1.5px solid var(--border)',
  fontSize: 15,
  outline: 'none',
  background: 'var(--bg)',
  color: 'var(--text)',
  transition: 'border-color 0.15s',
}
