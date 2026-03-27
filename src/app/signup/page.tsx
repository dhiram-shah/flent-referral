'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'form' | 'otp' | 'success'

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '' })
  const [otp, setOtp] = useState('')

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Verification failed')
        return
      }
      setReferralCode(data.referrer.referralCode)
      setStep('success')
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
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src="/logo.png" alt="flent" style={{ height: 26, display: 'block', margin: '0 auto' }} />
          </a>
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
          {/* ── Step: Form ───────────────────────────────────────────────── */}
          {step === 'form' && (
            <>
              <h1 className="serif" style={{ fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
                Join the program
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
                Enter your details to get your unique referral code.
              </p>
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
                <Field label="Mobile number" required>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    required
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
                <button type="submit" disabled={loading} className="btn-pill" style={{ width: '100%', marginTop: 4 }}>
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
                <div style={{ fontSize: 44, marginBottom: 12 }}>📧</div>
                <h1 className="serif" style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
                  Check your email
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  We sent a 6-digit code to <strong>{form.email}</strong>.
                  <br />
                  Enter it below to verify your account.
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
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-pill"
                  style={{ width: '100%' }}
                >
                  {loading ? 'Verifying…' : 'Verify & get my code'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                Didn&apos;t receive it? Check spam or{' '}
                <button
                  onClick={handleSignup as unknown as React.MouseEventHandler<HTMLButtonElement>}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand)',
                    cursor: 'pointer',
                    fontSize: 13,
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  resend
                </button>
                .
              </p>
            </>
          )}

          {/* ── Step: Success ─────────────────────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <h1 className="serif" style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>
                You&apos;re in!
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                Your referral code is ready. Share it with friends looking for co-living in Bangalore.
              </p>
              <div
                style={{
                  background: 'var(--brand)',
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 8l1.5 4.5L20 14l-4.5 1.5L14 20l-1.5-4.5L8 14l4.5-1.5z' fill='%23FFFFFF' fill-opacity='0.07'/%3E%3C/svg%3E\")",
                  borderRadius: 18,
                  padding: '24px 20px',
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 11,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  Your Referral Code
                </p>
                <p className="serif" style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: 4, margin: 0 }}>
                  {referralCode}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={copyCode} className="btn-pill" style={{ width: '100%' }}>
                  {copied ? '✓ Copied!' : 'Copy code'}
                </button>
                {/* Full-page navigation ensures proxy.ts reads the fresh cookie */}
                <a
                  href="/dashboard"
                  className="btn-pill-outline"
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
