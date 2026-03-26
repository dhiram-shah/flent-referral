'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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
  COMPLETED: { label: 'Completed ✓', color: '#059669', bg: '#D1FAE5' },
}

export default function DashboardPage() {
  const router = useRouter()
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
      if (res.status === 401) { router.push('/signup'); return }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [router])

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
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
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
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" style={{ color: 'var(--brand)', fontWeight: 800, fontSize: 22, textDecoration: 'none' }}>flent</a>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: 14, color: 'var(--muted)' }} className="hidden sm:block">Hi, {referrer.name.split(' ')[0]} 👋</span>
            <button onClick={handleLogout} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Top cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Referral code card */}
          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', borderRadius: 16, padding: 24, color: '#fff', gridColumn: 'span 2' }} className="md:col-span-2">
            <p style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Your Referral Code</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 700, letterSpacing: 3 }}>{referrer.referralCode}</span>
              <div className="flex gap-2">
                <button onClick={copyCode} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
                <button onClick={shareWhatsApp} style={{ background: '#25D366', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Share on WhatsApp
                </button>
              </div>
            </div>
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>Friends enter this code when enquiring on Flent</p>
          </div>

          {/* Stats card */}
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Current streak</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand)' }}>{streak}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Lifetime referrals</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{progress.lifetimeCount}</p>
            </div>
          </div>
        </div>

        {/* ── Milestone Roadmap ─────────────────────────────────────────────── */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 20 }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>Reward Roadmap</h2>
              {next ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {next.referralsRequired - streak} more referral{next.referralsRequired - streak !== 1 ? 's' : ''} to unlock <strong>{next.rewardName}</strong>
                </p>
              ) : (
                <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>🎉 All milestones cleared! Claim your reward below.</p>
              )}
            </div>
            {progress.canRedeem && (
              <button onClick={() => setShowRedeemModal(true)} style={{ background: 'var(--brand)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }} className="animate-pulse-ring">
                🎁 Claim Reward
              </button>
            )}
            {progress.hasPendingRedemption && (
              <div style={{ background: '#FEF3C7', color: '#D97706', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ⏳ Reward pending fulfilment
              </div>
            )}
          </div>

          {/* Progress bar */}
          {next && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <span>{streak} referrals</span>
                <span>{next.referralsRequired} needed</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(90deg, var(--brand), #4F46E5)', height: '100%', width: `${progressPct}%`, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}

          {/* Milestone tiles */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {milestones.map((m) => {
              const isUnlocked = streak >= m.referralsRequired
              const isCurrent = next?.id === m.id
              return (
                <div
                  key={m.id}
                  style={{
                    minWidth: 120,
                    background: isUnlocked ? 'linear-gradient(135deg, #7C3AED20, #4F46E520)' : 'var(--bg)',
                    border: isCurrent ? '2px solid var(--brand)' : isUnlocked ? '2px solid var(--success)' : '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '14px 12px',
                    textAlign: 'center',
                    flexShrink: 0,
                    opacity: isUnlocked ? 1 : 0.6,
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{isUnlocked ? '✅' : '🔒'}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {m.referralsRequired} ref.
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{m.rewardName}</div>
                  {isCurrent && <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 4, fontWeight: 600 }}>← Next</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Referrals List ────────────────────────────────────────────────── */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Your Referrals</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
            {referrals.length === 0
              ? 'No referrals yet — share your code to get started!'
              : `${referrals.length} referral${referrals.length !== 1 ? 's' : ''} in total`}
          </p>

          {referrals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
                Share your code with friends looking for quality co-living in Bangalore.
              </p>
              <button onClick={shareWhatsApp} style={{ background: '#25D366', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Share on WhatsApp
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {referrals.map((r) => {
                const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.INTERESTED
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
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
                <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                <h2 style={{ fontWeight: 700, fontSize: 20 }}>Reward claimed!</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>We&apos;ll fulfil your reward within 7 days. Your streak resets — time for round 2! 🎮</p>
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
                    <textarea value={redeemExtra} onChange={(e) => setRedeemExtra(e.target.value)} rows={3} placeholder="e.g., delivery address" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical' }} />
                  </div>
                )}
                {error && <div style={{ background: '#FEF2F2', color: 'var(--danger)', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowRedeemModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleRedeem} disabled={redeemLoading} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: redeemLoading ? '#C4B5FD' : 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: redeemLoading ? 'not-allowed' : 'pointer' }}>
                    {redeemLoading ? 'Claiming…' : 'Yes, claim this reward 🎁'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
