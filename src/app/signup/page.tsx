'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Step = 'form' | 'otp' | 'success'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')

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

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" style={{ color: 'var(--brand)', fontWeight: 800, fontSize: 28, textDecoration: 'none' }}>
            flent
          </a>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Referral Program</p>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 20,
            padding: '36px 32px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* ── Step: Form ─────────────────────────────────────────────────── */}
          {step === 'form' && (
            <>
              <h1 style={{ fontWeight: 700, fontSize: 24, marginBottom: 4 }}>Join the program</h1>
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
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Sending OTP…' : 'Get my referral code →'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
                Already have an account?{' '}
                <Link href="/dashboard" style={{ color: 'var(--brand)' }}>
                  Go to dashboard
                </Link>
              </p>
            </>
          )}

          {/* ── Step: OTP ──────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
                <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Check your email</h1>
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
                {error && <ErrorMsg>{error}</ErrorMsg>}
                <button type="submit" disabled={loading || otp.length < 6} style={btnStyle(loading || otp.length < 6)}>
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
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={handleSignup as unknown as React.MouseEventHandler<HTMLButtonElement>}
                  style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: 13, padding: 0 }}
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
              <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>You&apos;re in!</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                Your referral code is ready. Share it with friends looking for co-living in Bangalore.
              </p>
              <div
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  marginBottom: 24,
                }}
              >
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>
                  Your Referral Code
                </p>
                <p style={{ color: '#fff', fontSize: 26, fontWeight: 700, letterSpacing: 4, margin: 0 }}>
                  {referralCode}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode)
                }}
                style={{
                  ...btnStyle(false),
                  marginBottom: 12,
                  width: '100%',
                }}
              >
                Copy code
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Go to my dashboard →
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          By joining, you agree to Flent&apos;s{' '}
          <a href="https://flent.in/terms" style={{ color: 'var(--brand)' }}>Terms</a> &amp;{' '}
          <a href="https://flent.in/privacy" style={{ color: 'var(--brand)' }}>Privacy Policy</a>.
        </p>
      </div>
    </main>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
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
        borderRadius: 8,
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
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  fontSize: 15,
  outline: 'none',
  background: 'var(--bg)',
  color: 'var(--text)',
  transition: 'border-color 0.15s',
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px 20px',
    borderRadius: 10,
    border: 'none',
    background: disabled ? '#C4B5FD' : 'var(--brand)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
  }
}
