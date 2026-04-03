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
      setResendMsg('Sent on both mail & WA.')
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
                Didn&apos;t receive it?{' '}
                {resendCooldown > 0 ? (
                  <span style={{ color: 'var(--muted)' }}>Resend in {resendCooldown}s</span>
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
                    {resendLoading ? 'Sending…' : 'Resend'}
                  </button>
                )}
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
        d="M17.6 6.31999C16.8669 5.58141 15.9943 4.99596 15.033 4.59767C14.0716 4.19938 13.0406 3.99622 12 3.99999C10.6089 4.00135 9.24248 4.36819 8.03771 5.06377C6.83294 5.75935 5.83208 6.75926 5.13534 7.96335C4.4386 9.16745 4.07046 10.5335 4.06776 11.9246C4.06507 13.3158 4.42793 14.6832 5.12 15.89L4 20L8.2 18.9C9.35975 19.5452 10.6629 19.8891 11.99 19.9C14.0997 19.9001 16.124 19.0668 17.6222 17.5816C19.1205 16.0965 19.9715 14.0796 19.99 11.97C19.983 10.9173 19.7682 9.87634 19.3581 8.9068C18.948 7.93725 18.3505 7.05819 17.6 6.31999ZM12 18.53C10.8177 18.5308 9.65701 18.213 8.64 17.61L8.4 17.46L5.91 18.12L6.57 15.69L6.41 15.44C5.55925 14.0667 5.24174 12.429 5.51762 10.8372C5.7935 9.24545 6.64361 7.81015 7.9069 6.80322C9.1702 5.79628 10.7589 5.28765 12.3721 5.37368C13.9853 5.4597 15.511 6.13441 16.66 7.26999C17.916 8.49818 18.635 10.1735 18.66 11.93C18.6442 13.6859 17.9355 15.3645 16.6882 16.6006C15.441 17.8366 13.756 18.5301 12 18.53ZM15.61 13.59C15.41 13.49 14.44 13.01 14.26 12.95C14.08 12.89 13.94 12.85 13.81 13.05C13.6144 13.3181 13.404 13.5751 13.18 13.82C13.07 13.96 12.95 13.97 12.75 13.82C11.6097 13.3694 10.6597 12.5394 10.06 11.47C9.85 11.12 10.26 11.14 10.64 10.39C10.6681 10.3359 10.6827 10.2759 10.6827 10.215C10.6827 10.1541 10.6681 10.0941 10.64 10.04C10.64 9.93999 10.19 8.95999 10.03 8.56999C9.87 8.17999 9.71 8.23999 9.58 8.22999H9.19C9.08895 8.23154 8.9894 8.25465 8.898 8.29776C8.8066 8.34087 8.72546 8.403 8.66 8.47999C8.43562 8.69817 8.26061 8.96191 8.14676 9.25343C8.03291 9.54495 7.98287 9.85749 8 10.17C8.0627 10.9181 8.34443 11.6311 8.81 12.22C9.6622 13.4958 10.8301 14.5293 12.2 15.22C12.9185 15.6394 13.7535 15.8148 14.58 15.72C14.8552 15.6654 15.1159 15.5535 15.345 15.3915C15.5742 15.2296 15.7667 15.0212 15.91 14.78C16.0428 14.4856 16.0846 14.1583 16.03 13.84C15.94 13.74 15.81 13.69 15.61 13.59Z"
        fill="var(--brand)"
      />
    </svg>
  )
}
