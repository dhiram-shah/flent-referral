'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Verification failed')
        return
      }
      // Full-page navigation ensures proxy.ts reads the fresh cookie
      window.location.href = '/dashboard'
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src="/logo.png" alt="flent" style={{ height: 26, display: 'block', margin: '0 auto' }} />
          </Link>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Referral Program</p>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 24,
            padding: '36px 32px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 32px rgba(24,41,61,0.07)',
          }}
        >
          {/* ── Step: Email ──────────────────────────────────────────────── */}
          {step === 'email' && (
            <>
              <h1 className="serif" style={{ fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
                Welcome back
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
                Enter your email and we&apos;ll send you a sign-in code.
              </p>
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}
                  >
                    Email address <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    required
                    autoFocus
                    style={inputStyle}
                  />
                </div>
                {error && (
                  <div>
                    <div style={errorStyle}>{error}</div>
                    {error.includes('sign up') && (
                      <Link
                        href="/signup"
                        style={{ display: 'block', textAlign: 'center', marginTop: 8, color: 'var(--brand)', fontWeight: 600, fontSize: 13 }}
                      >
                        Create an account →
                      </Link>
                    )}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-pastel-violet" style={{ width: '100%', marginTop: 4 }}>
                  {loading ? 'Sending code…' : 'Send sign-in code →'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
                New here?{' '}
                <Link href="/signup" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                  Create an account
                </Link>
              </p>
            </>
          )}

          {/* ── Step: OTP ────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                  <MailIcon />
                </div>
                <h1 className="serif" style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
                  Check your email
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  We sent a 6-digit code to <strong>{email}</strong>.
                  <br />
                  Enter it below to sign in.
                </p>
              </div>
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                  required
                  style={{
                    ...inputStyle,
                    fontSize: 32,
                    textAlign: 'center',
                    letterSpacing: 12,
                    padding: '16px 20px',
                  }}
                  autoFocus
                />
                {error && <div style={errorStyle}>{error}</div>}
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-pastel-violet"
                  style={{ width: '100%' }}
                >
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError('') }}
                  className="btn-pastel-peach"
                  style={{ width: '100%', padding: '10px 20px', fontSize: 13 }}
                >
                  ← Use a different email
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                Didn&apos;t receive it? Check spam or{' '}
                <button
                  onClick={handleRequestOtp as unknown as React.MouseEventHandler<HTMLButtonElement>}
                  className="btn-pastel-peach"
                  style={{ padding: '7px 14px', fontSize: 12, boxShadow: '2px 2px 0 var(--brand)' }}
                >
                  Resend
                </button>
                .
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
          Questions?{' '}
          <a href="mailto:sales@flent.in" style={{ color: 'var(--brand)' }}>
            sales@flent.in
          </a>
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

const errorStyle: React.CSSProperties = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--danger)',
}

function MailIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5C4.5 6.67157 5.17157 6 6 6H18C18.8284 6 19.5 6.67157 19.5 7.5V16.5C19.5 17.3284 18.8284 18 18 18H6C5.17157 18 4.5 17.3284 4.5 16.5V7.5Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6 8L12 12.5L18 8"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
