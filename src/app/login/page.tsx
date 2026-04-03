'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startResendCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          cooldownRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

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
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.')
        return
      }
      setStep('otp')
      startResendCooldown()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendLoading(true)
    setResendMsg('')
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Could not resend. Please try again.')
        return
      }
      setResendMsg('Code resent to your email & WhatsApp.')
      startResendCooldown()
    } catch {
      setError('Could not resend. Please try again.')
    } finally {
      setResendLoading(false)
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
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Verification failed. Please try again.')
        return
      }
      // Full-page navigation ensures proxy.ts reads the fresh cookie
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Geometric pattern overlay */}
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

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <div style={{ background: 'var(--bg)', border: '1.5px solid var(--brand)', borderRadius: 999, padding: '7px 18px', display: 'inline-flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="flent" style={{ height: 22, display: 'block' }} />
            </div>
          </Link>
          <p style={{ color: 'rgba(21,16,46,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const, marginTop: 12 }}>Referral Program</p>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 24,
            padding: '36px 32px',
            border: '1.5px solid var(--brand)',
            boxShadow: '4px 4px 0 var(--brand)',
          }}
        >
          {/* ── Step: Email ──────────────────────────────────────────────── */}
          {step === 'email' && (
            <>
              <h1 className="serif-italic" style={{ fontWeight: 600, fontSize: 28, marginBottom: 4 }}>
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
                <button type="submit" disabled={loading} className="btn-base btn-pastel-violet" style={{ width: '100%', marginTop: 4 }}>
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
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <MailIcon />
                  <span style={{ color: 'var(--muted)', fontSize: 16, fontWeight: 300 }}>+</span>
                  <WhatsAppIcon />
                </div>
                <h1 className="serif-italic" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
                  Check Mail & WhatsApp
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  A 6-digit code has been sent to you.
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
                {resendMsg && (
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--success)', margin: 0 }}>
                    {resendMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-base btn-pastel-violet"
                  style={{ width: '100%' }}
                >
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError('') }}
                  className="btn-base btn-pastel-peach"
                  style={{ width: '100%', padding: '10px 20px', fontSize: 13 }}
                >
                  ← Use a different email
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                Didn&apos;t receive it? Check email or WhatsApp, or{' '}
                {resendCooldown > 0 ? (
                  <span style={{ color: 'var(--muted)' }}>resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'var(--brand)', fontWeight: 600, fontSize: 13,
                      cursor: resendLoading ? 'default' : 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {resendLoading ? 'sending…' : 'resend it'}
                  </button>
                )}
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
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function WhatsAppIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3C7.03 3 3 7.03 3 12c0 1.68.46 3.25 1.26 4.6L3 21l4.54-1.24A8.96 8.96 0 0012 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 10.5c.3 2.5 3.5 5.5 6 6"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
