'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'

type Step = 'form' | 'otp' | 'success'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void
        }
      }
    }
  }
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '' })
  const [otp, setOtp] = useState('')

  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Google sign-up failed. Please try again.')
        return
      }
      const typed = data as { isNew?: boolean; referrer?: { referralCode: string } }
      if (typed.isNew && typed.referrer?.referralCode) {
        setReferralCode(typed.referrer.referralCode)
        setStep('success')
      } else {
        // Existing user — go straight to dashboard
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Google sign-up failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }, [])

  function initGoogle() {
    if (!window.google || !googleBtnRef.current) return
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: googleBtnRef.current.offsetWidth,
      text: 'signup_with',
      shape: 'pill',
    })
  }

  useEffect(() => {
    if (step === 'form') initGoogle()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, string> = { name: form.name, email: form.email }
      if (form.phone) payload.phone = form.phone
      if (form.city) payload.city = form.city

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      const payload: Record<string, string> = { name: form.name, email: form.email }
      if (form.phone) payload.phone = form.phone
      if (form.city) payload.city = form.city

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Could not resend. Please try again.')
        return
      }
      setResendMsg('Code sent to your email.')
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
      const payload: Record<string, string> = { name: form.name, email: form.email, otp }
      if (form.phone) payload.phone = form.phone
      if (form.city) payload.city = form.city

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Verification failed. Please try again.')
        return
      }
      setReferralCode((data as { referrer: { referralCode: string } }).referrer.referralCode)
      setStep('success')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}
    >
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogle}
      />

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

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
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
          {/* ── Step: Form ───────────────────────────────────────────────── */}
          {step === 'form' && (
            <>
              <h1 className="serif-italic" style={{ fontWeight: 600, fontSize: 28, marginBottom: 4 }}>
                Join the program
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
                Sign up with Google or fill in your details.
              </p>

              {/* Google Sign-In */}
              <div
                ref={googleBtnRef}
                style={{ width: '100%', minHeight: 44, marginBottom: 4 }}
              />
              {googleLoading && (
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', margin: '8px 0 0' }}>
                  Setting up your account...
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                  or
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Full name" required>
                  <input
                    type="text"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                    minLength={2}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Mobile number (optional)">
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Email address" required>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                    style={inputStyle}
                  />
                </Field>
                <Field label="City (optional)">
                  <input
                    type="text"
                    placeholder="Bangalore"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                {error && <ErrorMsg>{error}</ErrorMsg>}
                <button type="submit" disabled={loading} className="btn-base btn-pastel-violet" style={{ width: '100%', marginTop: 4 }}>
                  {loading ? 'Sending OTP…' : 'Get my referral code →'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                  Sign in
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
                </div>
                <h1 className="serif-italic" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
                  Check your email
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  A 6-digit code has been sent to your inbox.
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
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
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
                {error && <ErrorMsg>{error}</ErrorMsg>}
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
                  {loading ? 'Verifying…' : 'Verify & get my code'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="btn-base btn-pastel-peach"
                  style={{ width: '100%', padding: '12px 20px', fontSize: 13 }}
                >
                  ← Back
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

          {/* ── Step: Success ─────────────────────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
                <SealIcon />
              </div>
              <h1 className="serif-italic" style={{ fontWeight: 600, fontSize: 28, marginBottom: 8 }}>
                You&apos;re in!
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                Your referral code is ready. Share it with friends looking for co-living in Bangalore.
              </p>
              <div
                style={{
                  background: '#F5F1E9',
                  borderRadius: 16,
                  padding: '24px 20px',
                  marginBottom: 20,
                  border: '1px solid rgba(21,16,46,0.10)',
                }}
              >
                <p
                  style={{
                    color: 'rgba(21,16,46,0.45)',
                    fontSize: 11,
                    marginBottom: 10,
                    textTransform: 'uppercase' as const,
                    letterSpacing: 3,
                    fontWeight: 700,
                  }}
                >
                  Your Referral Code
                </p>
                <p className="serif-italic" style={{ color: 'var(--brand)', fontSize: 36, fontWeight: 700, letterSpacing: 6, margin: 0, lineHeight: 1.1 }}>
                  {referralCode}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={copyCode} className="btn-base btn-pastel-violet" style={{ width: '100%' }}>
                  {copied ? <><CopyCheckIcon /> Copied!</> : 'Copy code'}
                </button>
                {/* Full-page navigation ensures proxy.ts reads the fresh cookie */}
                <a
                  href="/dashboard"
                  className="btn-base btn-pastel-peach"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Go to my dashboard →
                </a>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
          By joining, you agree to Flent&apos;s{' '}
          <a href="https://flent.in/terms" style={{ color: 'var(--brand)' }}>
            Terms
          </a>{' '}
          &amp;{' '}
          <a href="https://flent.in/privacy" style={{ color: 'var(--brand)' }}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}
      >
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        color: 'var(--danger)',
      }}
    >
      {children}
    </div>
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

function CopyCheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SealIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5L14.2 5.1L16.9 4.6L17.4 7.3L19.6 9L18 11.2L18.6 13.9L15.9 14.4L14.2 16.6L12 15L9.8 16.6L8.1 14.4L5.4 13.9L6 11.2L4.4 9L6.6 7.3L7.1 4.6L9.8 5.1L12 3.5Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20.5V16.6M14.5 20.5V16.6"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
