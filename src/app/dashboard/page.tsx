'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const TIER_COLOR_MAP: Record<string, { color: string; bg: string }> = {
  info:    { color: 'var(--info)',    bg: 'var(--info-light)' },
  success: { color: 'var(--success)', bg: 'var(--success-light)' },
  brand:   { color: 'var(--brand)',   bg: 'var(--pastel-violet)' },
  warning: { color: '#D97706',        bg: '#FEF3C7' },
}

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

interface RedemptionRecord {
  id: string
  milestoneId: string
  rewardName: string
  tierNumber: number
  rewardValue: string | null
  fulfilledAt: string | null
  requestedAt: string
}

interface Progress {
  streakCount: number
  lifetimeCount: number
  nextMilestone: Milestone | null
  redeemableMilestones: Milestone[]
  pendingRedemption: { milestoneId: string; rewardName: string; tierNumber: number } | null
  redeemedHistory: RedemptionRecord[]
  totalEarnedValue: number
}

interface LeaderboardEntry {
  rank: number
  referrerId: string
  displayName: string | null
  quarterlyCount: number
  tierName: string | null
  tierColorToken: string | null
}

interface TierInfo {
  id: number
  name: string
  minReferrals: number
  colorToken: string
}

interface LeaderboardData {
  ambassadorTier: { name: string; colorToken: string } | null
  allTiers: TierInfo[]
  leaderboardOptIn: boolean
  quarterly: {
    rank: number | null
    total: number
    quarterlyCount: number
    quarter: string
    resetsOn: string
  }
}

interface DashboardData {
  waShareText: string
  igShareText: string
  referrer: { id: string; name: string; email: string; phone: string; referralCode: string; isTenant: boolean }
  progress: Progress
  milestones: Milestone[]
  referrals: Referral[]
  leaderboard?: LeaderboardData
}

type MilestoneState = 'locked' | 'eligible' | 'eligible_blocked' | 'pending'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  INTERESTED: { label: 'Interested', color: '#D97706', bg: '#FEF3C7' },
  AGREEMENT_SIGNED: { label: 'Agreement Signed', color: '#2563EB', bg: '#DBEAFE' },
  COMPLETED: { label: 'Completed', color: '#059669', bg: '#D1FAE5' },
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState<string | null>(null)
  const [redeemExtra, setRedeemExtra] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const [error, setError] = useState('')
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [leaderboardMeta, setLeaderboardMeta] = useState<{ quarter: string; totalParticipants: number } | null>(null)
  const [optInLoading, setOptInLoading] = useState(false)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const [igCopied, setIgCopied] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [meRes, lbRes] = await Promise.all([
        fetch('/api/referrers/me'),
        fetch('/api/leaderboard'),
      ])
      if (meRes.status === 401) { window.location.href = '/signup'; return }
      const json = await meRes.json()
      setData(json)
      if (lbRes.ok) {
        const lbJson = await lbRes.json()
        setLeaderboardEntries(lbJson.entries ?? [])
        setLeaderboardMeta({ quarter: lbJson.quarter, totalParticipants: lbJson.totalParticipants })
      }
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
    window.open(`https://wa.me/?text=${encodeURIComponent(data.waShareText)}`, '_blank')
  }

  async function handleRedeem() {
    if (!selectedMilestone) return
    setRedeemLoading(true)
    setError('')
    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: selectedMilestone.id,
          extraInfo: redeemExtra ? { info: redeemExtra } : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setRedeemSuccess(true)
      setTimeout(() => { setSelectedMilestone(null); setRedeemSuccess(false); setRedeemExtra(''); fetchData() }, 2500)
    } finally {
      setRedeemLoading(false)
    }
  }

  async function shareInstagram() {
    if (!data) return
    const text = data.igShareText
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch { /* user cancelled or not supported */ }
    await navigator.clipboard.writeText(text)
    setIgCopied(true)
    setTimeout(() => setIgCopied(false), 3000)
    window.open('https://www.instagram.com/', '_blank')
  }

  async function handleOptIn(value: boolean) {
    if (!data) return
    setOptInLoading(true)
    try {
      await fetch('/api/referrers/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderboardOptIn: value }),
      })
      setData((d) => d ? { ...d, leaderboard: d.leaderboard ? { ...d.leaderboard, leaderboardOptIn: value } : d.leaderboard } : d)
      // Refresh leaderboard list
      const lbRes = await fetch('/api/leaderboard')
      if (lbRes.ok) {
        const lbJson = await lbRes.json()
        setLeaderboardEntries(lbJson.entries ?? [])
      }
    } finally {
      setOptInLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  function getMilestoneState(m: Milestone, progress: Progress, streak: number): MilestoneState {
    if (progress.pendingRedemption?.milestoneId === m.id) return 'pending'
    if (streak >= m.referralsRequired) {
      return progress.pendingRedemption ? 'eligible_blocked' : 'eligible'
    }
    return 'locked'
  }

  function getProgressCopy(progress: Progress, streak: number): { text: string; color: string } {
    if (progress.redeemableMilestones.length > 0) {
      const n = progress.redeemableMilestones.length
      return {
        text: `${n} reward${n > 1 ? 's' : ''} ready to claim — pick one below`,
        color: '#059669',
      }
    }
    if (progress.pendingRedemption) {
      return {
        text: `Your ${progress.pendingRedemption.rewardName} reward is being processed`,
        color: '#D97706',
      }
    }
    if (progress.nextMilestone) {
      const needed = progress.nextMilestone.referralsRequired - streak
      return {
        text: `${needed} more referral${needed !== 1 ? 's' : ''} to unlock ${progress.nextMilestone.rewardName}`,
        color: 'var(--muted)',
      }
    }
    return { text: 'You\'ve cleared every milestone — keep referring!', color: 'var(--muted)' }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const progressCopy = getProgressCopy(progress, streak)

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', background: 'var(--bg)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
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
              <button onClick={handleLogout} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Sign out
              </button>
            </div>
          </div>
        </nav>

        {/* Hero — greeting + code */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) 24px clamp(32px, 4vw, 48px)', textAlign: 'center' }}>

          {/* Ambassador circle badge */}
          {(() => {
            const tier = data.leaderboard?.ambassadorTier
            const tc = tier ? (TIER_COLOR_MAP[tier.colorToken] ?? TIER_COLOR_MAP.brand) : null
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                <button
                  onClick={() => setBadgeOpen((v) => !v)}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: tc?.bg ?? 'var(--brand-light)',
                    border: `3px solid ${tc?.color ?? 'var(--brand)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                    transition: 'transform 0.12s ease',
                  }}
                  aria-label={tier ? `${tier.name} — click to see tiers` : 'Click to learn about ambassador tiers'}
                >
                  <span className="serif-italic" style={{ fontSize: 28, fontWeight: 700, color: tc?.color ?? 'var(--brand)', lineHeight: 1, userSelect: 'none' }}>
                    {referrer.name[0].toUpperCase()}
                  </span>
                </button>

                {tier ? (
                  <button
                    onClick={() => setBadgeOpen((v) => !v)}
                    style={{ marginTop: 8, background: tc!.bg, color: tc!.color, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99, textTransform: 'uppercase' as const, letterSpacing: 1, border: `1px solid ${tc!.color}`, cursor: 'pointer' }}
                  >
                    {tier.name}
                  </button>
                ) : (
                  <button
                    onClick={() => setBadgeOpen((v) => !v)}
                    style={{ marginTop: 8, background: 'none', border: 'none', fontSize: 12, color: 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Earn your first badge
                  </button>
                )}

                {/* Tier info popover */}
                {badgeOpen && (
                  <div style={{
                    marginTop: 12, background: 'var(--surface)', borderRadius: 16,
                    border: '1.5px solid var(--brand)', boxShadow: '3px 3px 0 var(--brand)',
                    padding: '16px 20px', maxWidth: 300, width: '100%', textAlign: 'left',
                  }}>
                    <p style={{ fontWeight: 700, fontSize: 11, marginBottom: 14, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: 2 }}>Ambassador Tiers</p>
                    {(data.leaderboard?.allTiers ?? []).map((t) => {
                      const ttc = TIER_COLOR_MAP[t.colorToken] ?? TIER_COLOR_MAP.brand
                      const achieved = progress.lifetimeCount >= t.minReferrals
                      const isCurrent = data.leaderboard?.ambassadorTier?.name === t.name
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, opacity: achieved ? 1 : 0.38 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: achieved ? ttc.color : 'var(--border)', flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: 'var(--text)' }}>{t.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.minReferrals}+ referrals</span>
                          {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, background: ttc.bg, color: ttc.color, padding: '2px 8px', borderRadius: 99 }}>you</span>}
                        </div>
                      )
                    })}
                    {!data.leaderboard?.ambassadorTier && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
                        Complete your first referral to earn the Scout badge and appear on the quarterly leaderboard.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Greeting */}
          <h1 className="serif-italic" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600, color: 'var(--brand)', lineHeight: 1.15, marginBottom: 24 }}>
            Hey, {referrer.name.split(' ')[0]}
          </h1>

          {/* Code box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg)',
            border: '1.5px solid var(--brand)',
            boxShadow: '4px 4px 0 var(--brand)',
            borderRadius: 14,
            padding: '10px 10px 10px 20px',
            marginBottom: 10,
          }}>
            <span
              className="serif-italic"
              style={{
                fontSize: 'clamp(18px, 3vw, 28px)',
                fontWeight: 600,
                color: 'var(--brand)',
                letterSpacing: 3,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                flex: 1,
                textAlign: 'left',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {referrer.referralCode}
            </span>
            <button onClick={copyCode} className="btn-base btn-pastel-violet" style={{ flexShrink: 0, fontSize: 13, padding: '9px 18px' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Share buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={shareWhatsApp} className="btn-base btn-pastel-peach" style={{ padding: '13px 16px', fontSize: 14 }}>
              WhatsApp
            </button>
            <button onClick={shareInstagram} className="btn-base btn-pastel-violet" style={{ padding: '13px 16px', fontSize: 14 }}>
              {igCopied ? 'Caption copied!' : 'Instagram'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: progress.redeemedHistory.length > 0 ? '1fr 1fr 1fr' : '1fr 1fr' }}>
          <div style={{ padding: '24px 20px', borderRight: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Current streak</p>
            <p className="serif" style={{ fontSize: 52, fontWeight: 700, color: 'var(--brand)', lineHeight: 1 }}>{streak}</p>
          </div>
          <div style={{ padding: '24px 20px', borderRight: progress.redeemedHistory.length > 0 ? '1px solid var(--border)' : undefined, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Lifetime referrals</p>
            <p className="serif" style={{ fontSize: 52, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{progress.lifetimeCount}</p>
          </div>
          {progress.redeemedHistory.length > 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Rewards claimed</p>
              <p className="serif" style={{ fontSize: 52, fontWeight: 700, color: '#059669', lineHeight: 1 }}>{progress.redeemedHistory.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(24px, 4vw, 40px) 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Quarterly Standing ──────────────────────────────────────────────── */}
        {data.leaderboard && (
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Quarterly Standing</h2>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {leaderboardMeta?.quarter ?? data.leaderboard.quarterly.quarter} · resets {new Date(data.leaderboard.quarterly.resetsOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              {data.leaderboard.quarterly.rank && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', lineHeight: 1 }}>
                    #{data.leaderboard.quarterly.rank}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                    of {leaderboardMeta?.totalParticipants ?? data.leaderboard.quarterly.total} referrers · {data.leaderboard.quarterly.quarterlyCount} this quarter
                  </p>
                </div>
              )}
            </div>

            {/* Leaderboard list */}
            {leaderboardEntries.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {leaderboardEntries.slice(0, 5).map((entry) => {
                  const isYou = entry.referrerId === referrer.id
                  const tc = entry.tierColorToken ? TIER_COLOR_MAP[entry.tierColorToken] : null
                  return (
                    <div
                      key={entry.referrerId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        background: isYou ? 'var(--brand-light)' : 'var(--bg)',
                        border: isYou ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', minWidth: 24, textAlign: 'right' }}>
                        #{entry.rank}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: isYou ? 700 : 500, color: 'var(--text)' }}>
                        {entry.displayName ?? 'Anonymous'}{isYou ? ' (you)' : ''}
                      </span>
                      {entry.tierName && tc && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: tc.bg, color: tc.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {entry.tierName}
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 20, textAlign: 'right' }}>
                        {entry.quarterlyCount}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '16px 0', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                  No referrals completed this quarter yet — yours could be first.
                </p>
              </div>
            )}

            {/* Opt-in toggle */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div
                onClick={() => !optInLoading && handleOptIn(!data.leaderboard!.leaderboardOptIn)}
                style={{
                  width: 36, height: 20, borderRadius: 99, flexShrink: 0, cursor: optInLoading ? 'wait' : 'pointer',
                  background: data.leaderboard.leaderboardOptIn ? 'var(--brand)' : 'var(--border)',
                  position: 'relative', transition: 'background 0.2s', marginTop: 2,
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: data.leaderboard.leaderboardOptIn ? 19 : 3,
                  transition: 'left 0.2s',
                }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  Show my name on the leaderboard
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Your first name will be visible to other referrers. Toggle off anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Reward Journey ───────────────────────────────────────────────────── */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1px solid var(--border)' }}>

          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Reward Journey</h2>
            <p style={{ fontSize: 13, color: progressCopy.color, fontWeight: progress.redeemableMilestones.length > 0 ? 600 : 400 }}>
              {progressCopy.text}
            </p>
          </div>

          {/* Milestone cards */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {milestones.map((m) => {
              const state = getMilestoneState(m, progress, streak)
              const isHovered = hoveredMilestoneId === m.id && state === 'eligible'

              const cardStyle: React.CSSProperties = {
                minWidth: 140,
                flexShrink: 0,
                borderRadius: 16,
                padding: '16px 14px',
                textAlign: 'center',
                position: 'relative',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                ...(state === 'locked' && {
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  opacity: 0.38,
                  cursor: 'default',
                }),
                ...(state === 'eligible' && {
                  background: 'var(--brand-light)',
                  border: '1.5px solid var(--brand)',
                  boxShadow: isHovered ? '3px 3px 0 var(--brand)' : '2px 2px 0 var(--brand)',
                  cursor: 'pointer',
                  transform: isHovered ? 'translate(-1px, -1px)' : 'none',
                }),
                ...(state === 'eligible_blocked' && {
                  background: 'var(--brand-light)',
                  border: '1px solid rgba(21,16,46,0.18)',
                  opacity: 0.65,
                  cursor: 'default',
                }),
                ...(state === 'pending' && {
                  background: '#FEF3C7',
                  border: '1.5px solid #D97706',
                  boxShadow: '2px 2px 0 #D97706',
                  cursor: 'default',
                }),
              }

              return (
                <div
                  key={m.id}
                  style={cardStyle}
                  onClick={() => state === 'eligible' ? setSelectedMilestone(m) : undefined}
                  onMouseEnter={() => state === 'eligible' ? setHoveredMilestoneId(m.id) : undefined}
                  onMouseLeave={() => setHoveredMilestoneId(null)}
                >
                  {/* Tier label */}
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(21,16,46,0.35)', textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 12, textAlign: 'left' }}>
                    TIER {m.tierNumber}
                  </div>

                  {/* Big referral count */}
                  <span className="serif-italic" style={{ fontSize: 42, fontWeight: 700, color: 'var(--brand)', lineHeight: 1, display: 'block' }}>
                    {m.referralsRequired}
                  </span>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(21,16,46,0.35)', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 12 }}>
                    {m.referralsRequired === 1 ? 'referral' : 'referrals'}
                  </div>

                  {/* Divider */}
                  <div style={{ width: 24, height: 1, background: 'rgba(21,16,46,0.1)', margin: '0 auto 12px' }} />

                  {/* Reward name */}
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--brand)', marginBottom: 4, lineHeight: 1.3 }}>
                    {m.rewardName}
                  </div>
                  {m.rewardValue && (
                    <div style={{ fontSize: 11, color: 'rgba(21,16,46,0.45)', marginBottom: 12 }}>
                      ₹{parseInt(m.rewardValue.replace(/[^0-9]/g, '') || '0').toLocaleString('en-IN')}
                    </div>
                  )}

                  {/* State badge */}
                  {state === 'eligible' && (
                    <div style={{
                      fontSize: 11, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 999,
                      background: isHovered ? 'var(--brand)' : '#D1FAE5',
                      color: isHovered ? '#fff' : '#059669',
                      transition: 'background 0.12s, color 0.12s',
                    }}>
                      {isHovered ? 'Claim now →' : 'Unlocked'}
                    </div>
                  )}
                  {state === 'eligible_blocked' && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(21,16,46,0.45)' }}>
                      Unlocked
                    </div>
                  )}
                  {state === 'pending' && (
                    <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#FEF9C3', color: '#D97706' }}>
                      Pending
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pending note */}
          {progress.pendingRedemption && (
            <p style={{ marginTop: 14, fontSize: 12, color: '#D97706', fontWeight: 600 }}>
              Your <strong>{progress.pendingRedemption.rewardName}</strong> reward is being fulfilled — we&apos;ll reach out within 7 days. Other unlocked rewards can be claimed once this is complete.
            </p>
          )}

          {/* Rewards history */}
          {progress.redeemedHistory.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Rewards history</p>
                {progress.totalEarnedValue > 0 && (
                  <div style={{ background: '#D1FAE5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                    Total earned · ₹{progress.totalEarnedValue.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {progress.redeemedHistory.map((r) => (
                  <div
                    key={r.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 6 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckIcon />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{r.rewardName}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>Tier {r.tierNumber} · Fulfilled {formatDate(r.fulfilledAt)}</p>
                      </div>
                    </div>
                    {r.rewardValue && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                        ₹{parseInt(r.rewardValue.replace(/[^0-9]/g, '') || '0').toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Referrals List ──────────────────────────────────────────────────── */}
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
              <button onClick={shareWhatsApp} className="btn-base btn-pastel-peach">Share on WhatsApp</button>
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

      {/* ── Redeem Modal ──────────────────────────────────────────────────────────── */}
      {selectedMilestone && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget && !redeemLoading) { setSelectedMilestone(null); setRedeemExtra(''); setError('') } }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', border: '1.5px solid var(--brand)', boxShadow: '4px 4px 0 var(--brand)' }}>
            {redeemSuccess ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckIconLg />
                </div>
                <h2 className="serif-italic" style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>Reward claimed!</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
                  We&apos;ll fulfil your <strong>{selectedMilestone.rewardName}</strong> within 7 days. Your streak resets — time for round 2!
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(21,16,46,0.38)', textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 6 }}>
                    TIER {selectedMilestone.tierNumber} · {selectedMilestone.referralsRequired} {selectedMilestone.referralsRequired === 1 ? 'referral' : 'referrals'}
                  </div>
                  <h2 className="serif-italic" style={{ fontWeight: 600, fontSize: 22, marginBottom: 4 }}>
                    Claim {selectedMilestone.rewardName}
                  </h2>
                  {selectedMilestone.rewardDescription && (
                    <p style={{ color: 'var(--muted)', fontSize: 14 }}>{selectedMilestone.rewardDescription}</p>
                  )}
                  {selectedMilestone.rewardValue && (
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 4 }}>
                      Value: ₹{parseInt(selectedMilestone.rewardValue.replace(/[^0-9]/g, '') || '0').toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400E', marginBottom: 20, lineHeight: 1.5 }}>
                  Claiming resets your streak to 0. You can build it back up and claim again.
                </div>

                {selectedMilestone.requiresExtraInfo && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      {selectedMilestone.extraInfoLabel ?? 'Additional Information'} <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <textarea
                      value={redeemExtra}
                      onChange={(e) => setRedeemExtra(e.target.value)}
                      rows={3}
                      placeholder="e.g., delivery address"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical', background: 'var(--bg)' }}
                    />
                  </div>
                )}

                {error && (
                  <div style={{ background: '#FEF2F2', color: 'var(--danger)', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setSelectedMilestone(null); setRedeemExtra(''); setError('') }}
                    className="btn-base btn-pill-outline"
                    style={{ flex: 1, padding: '12px' }}
                    disabled={redeemLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRedeem}
                    disabled={redeemLoading || (selectedMilestone.requiresExtraInfo && !redeemExtra.trim())}
                    className="btn-base btn-pill"
                    style={{ flex: 2, padding: '12px' }}
                  >
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIconLg() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
