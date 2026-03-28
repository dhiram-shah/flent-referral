'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Milestone {
  id: string
  tierNumber: number
  referralsRequired: number
  rewardName: string
  rewardDescription?: string
  rewardValue?: string
  requiresExtraInfo: boolean
  extraInfoLabel?: string
}

interface Referral {
  id: string
  refereeName: string
  refereePhone: string
  status: 'INTERESTED' | 'AGREEMENT_SIGNED' | 'COMPLETED'
  interestedAt: string
  signedAt?: string
  completedAt?: string
}

interface Progress {
  streakCount: number
  lifetimeCount: number
  unlockedMilestone: Milestone | null
  nextMilestone: Milestone | null
  canRedeem: boolean
  hasPendingRedemption: boolean
}

interface DashboardData {
  referrer: { id: string; name: string; email: string; phone: string; referralCode: string; isTenant: boolean }
  progress: Progress
  milestones: Milestone[]
  referrals: Referral[]
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  INTERESTED: { label: 'Interested', color: '#D97706', bg: '#FEF3C7' },
  AGREEMENT_SIGNED: { label: 'Agreement Signed', color: '#2563EB', bg: '#DBEAFE' },
  COMPLETED: { label: 'Completed', color: '#059669', bg: '#D1FAE5' },
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemExtra, setRedeemExtra] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/referrers/me')
      if (res.status === 401) { window.location.href = '/signup'; return }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function copyCode() {
    if (!data) return
    navigator.clipboard.writeText(data.referrer.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    if (!data) return
    const msg = encodeURIComponent(
      `Hey! I've been using Flent for my Bangalore accommodation and it's been great. Check them out and use my referral code *${data.referrer.referralCode}* when you enquire. They've got amazing co-living spaces! 🏠 https://flent.in`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  async function handleRedeem() {
    if (!data?.progress.unlockedMilestone) return
    setRedeemLoading(true)
    setError('')
    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: data.progress.unlockedMilestone.id,
          extraInfo: redeemExtra ? { info: redeemExtra } : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setRedeemSuccess(true)
      setTimeout(() => { setShowRedeemModal(false); setRedeemSuccess(false); fetchData() }, 2000)
    } finally {
      setRedeemLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--brand-light)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { referrer, progress, milestones, referrals } = data
  const streak = progress.streakCount
  const next = progress.nextMilestone
  const progressPct = next ? Math.min((streak / next.referralsRequired) * 100, 100) : 100

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header — mirrors homepage hero aesthetic ─────────────────────────── */}
      <div style={{ position: 'relative', background: 'var(--bg)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* Geometric pattern — same as landing page */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: "url('/patterns/pie-factory.svg')",
            backgroundSize: '60px 60px',
            backgroundRepeat: 'repeat',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Nav */}
        <nav style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg)', border: '1.5px solid var(--brand)', borderRadius: 999, padding: '7px 18px', display: 'inline-flex', alignItems: 'center' }}>
                <img src="/logo.png" alt="flent" style={{ height: 22, display: 'block' }} />
              </div>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                Hi, {referrer.name.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px clamp(48px, 7vw, 80px)', textAlign: 'center' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--brand-light)', color: 'var(--brand)', padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 }} />
            Your referral code
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-sans), "Plus Jakarta Sans", sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
              Share with friends moving to Bangalore
            </p>
            <p
              className="serif-italic"
              style={{
                fontSize: 'clamp(56px, 12vw, 96px)',
                fontWeight: 500,
                color: 'var(--brand)',
                letterSpacing: 6,
                lineHeight: 1,
              }}
            >
              {referrer.referralCode}
            </p>
          </div>

          <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32, lineHeight: 1.6, maxWidth: 420, margin: '0 auto 32px' }}>
            Friends enter this code when they enquire on Flent — you earn a reward when they move in.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={copyCode} className="btn-pastel-violet">
              {copied ? '✓ Copied!' : 'Copy code'}
            </button>
            <button onClick={shareWhatsApp} className="btn-pastel-peach">
              Share on WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: '24px 20px', borderRight: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Current streak</p>
            <p className="serif" style={{ fontSize: 52, fontWeight: 700, color: 'var(--brand)', lineHeight: 1 }}>{streak}</p>
          </div>
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Lifetime referrals</p>
            <p className="serif" style={{ fontSize: 52, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{progress.lifetimeCount}</p>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(24px, 4vw, 40px) 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Milestone Roadmap */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Reward Roadmap</h2>
              {next ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {next.referralsRequired - streak} more referral{next.referralsRequired - streak !== 1 ? 's' : ''} to unlock <strong>{next.rewardName}</strong>
                </p>
              ) : (
                <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>All milestones cleared — claim your reward below.</p>
              )}
            </div>
            {progress.canRedeem && (
              <button onClick={() => setShowRedeemModal(true)} className="btn-pastel-violet animate-pulse-ring" style={{ fontSize: 14, padding: '10px 24px' }}>
                Claim reward
              </button>
            )}
            {progress.hasPendingRedemption && (
              <div style={{ background: '#FEF3C7', color: '#D97706', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                Reward pending fulfilment
              </div>
            )}
          </div>

          {next && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <span>{streak} referrals</span>
                <span>{next.referralsRequired} needed</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ background: 'var(--brand)', height: '100%', width: `${progressPct}%`, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {milestones.map((m) => {
              const isUnlocked = streak >= m.referralsRequired
              const isCurrent = next?.id === m.id
              return (
                <div
                  key={m.id}
                  style={{
                    minWidth: 120,
                    background: isUnlocked ? 'var(--brand-light)' : 'var(--bg)',
                    border: (isUnlocked || isCurrent) ? '2px solid var(--brand)' : '1px solid var(--border)',
                    boxShadow: (isUnlocked || isCurrent) ? '2px 2px 0 var(--brand)' : 'none',
                    borderRadius: 14,
                    padding: '14px 12px',
                    textAlign: 'center',
                    flexShrink: 0,
                    opacity: (!isUnlocked && !isCurrent) ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    {m.referralsRequired} ref.
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{m.rewardName}</div>
                  {isUnlocked && !isCurrent && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 6, fontWeight: 700 }}>Unlocked</div>}
                  {isCurrent && <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 6, fontWeight: 700 }}>Next up</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Referrals List */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Your Referrals</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
            {referrals.length === 0
              ? 'No referrals yet — share your code to get started!'
              : `${referrals.length} referral${referrals.length !== 1 ? 's' : ''} in total`}
          </p>

          {referrals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
                Share your code with friends looking for quality co-living in Bangalore.
              </p>
              <button onClick={shareWhatsApp} className="btn-pastel-peach">
                Share on WhatsApp
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {referrals.map((r) => {
                const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.INTERESTED
                return (
                  <div
                    key={r.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{r.refereeName}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {r.refereePhone.slice(0, 5)}XXXXX · {new Date(r.interestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99 }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Redeem Modal ─────────────────────────────────────────────────────── */}
      {showRedeemModal && progress.unlockedMilestone && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {redeemSuccess ? (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Reward claimed!</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>We&apos;ll fulfil your reward within 7 days. Your streak resets — time for round 2!</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Claim your reward</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>You&apos;ve unlocked: <strong>{progress.unlockedMilestone.rewardName}</strong></p>
                {progress.unlockedMilestone.requiresExtraInfo && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      {progress.unlockedMilestone.extraInfoLabel ?? 'Additional Information'}
                    </label>
                    <textarea
                      value={redeemExtra}
                      onChange={(e) => setRedeemExtra(e.target.value)}
                      rows={3}
                      placeholder="e.g., delivery address"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical' }}
                    />
                  </div>
                )}
                {error && <div style={{ background: '#FEF2F2', color: 'var(--danger)', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowRedeemModal(false)} className="btn-pill-outline" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                  <button onClick={handleRedeem} disabled={redeemLoading} className="btn-pill" style={{ flex: 2, padding: '12px' }}>
                    {redeemLoading ? 'Claiming…' : 'Claim this reward'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </main>
  )
}
