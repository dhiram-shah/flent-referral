'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'overview' | 'referrers' | 'redemptions' | 'milestones'

interface Stats {
  totalReferrers: number
  activeReferrers: number
  totalReferrals: number
  referralsByStatus: Record<string, number>
  pendingRedemptions: number
  totalRedemptions: number
  recentSignups: number
}

interface AdminReferrer {
  id: string
  name: string
  email: string
  phone: string
  referralCode: string
  isActive: boolean
  isDisqualified: boolean
  isTenant: boolean
  createdAt: string
  progress?: { currentStreakCount: number; lifetimeCompletedCount: number }
  _count?: { referrals: number }
}

interface Redemption {
  id: string
  status: string
  requestedAt: string
  extraInfo?: Record<string, string>
  notes?: string
  referrer: { name: string; email: string; phone: string }
  milestone: { rewardName: string; tierNumber: number; requiresExtraInfo: boolean }
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
  isActive: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [referrers, setReferrers] = useState<AdminReferrer[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [milestoneForm, setMilestoneForm] = useState({
    tierNumber: '', referralsRequired: '', rewardName: '', rewardDescription: '', rewardValue: '', requiresExtraInfo: false, extraInfoLabel: '', isActive: true,
  })
  const [milestoneLoading, setMilestoneLoading] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null)
  const [fulfillNote, setFulfillNote] = useState('')
  const [fulfillLoading, setFulfillLoading] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, refsRes, redemsRes, milesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/referrers'),
        fetch('/api/admin/redemptions/pending'),
        fetch('/api/admin/milestones'),
      ])
      if (statsRes.status === 401) { router.push('/admin/login'); return }
      const [statsData, refsData, redemsData, milesData] = await Promise.all([
        statsRes.json(), refsRes.json(), redemsRes.json(), milesRes.json(),
      ])
      setStats(statsData.stats)
      setReferrers(refsData.referrers ?? [])
      setRedemptions(redemsData.redemptions ?? [])
      setMilestones(milesData.milestones ?? [])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (tab !== 'referrers') return
      const res = await fetch(`/api/admin/referrers?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setReferrers(data.referrers ?? [])
    }, 300)
    return () => clearTimeout(handler)
  }, [search, tab])

  async function toggleReferrer(id: string, field: 'isActive' | 'isDisqualified', value: boolean, note?: string) {
    await fetch(`/api/admin/referrers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value, ...(note ? { disqualifyNote: note } : {}) }),
    })
    fetchAll()
  }

  async function fulfillRedemption(id: string, status: 'FULFILLED' | 'REJECTED') {
    setFulfillLoading(id)
    try {
      await fetch(`/api/admin/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: fulfillNote }),
      })
      setFulfillNote('')
      fetchAll()
    } finally {
      setFulfillLoading(null)
    }
  }

  async function saveMilestone() {
    setMilestoneLoading(true)
    try {
      const body = {
        ...milestoneForm,
        tierNumber: parseInt(milestoneForm.tierNumber),
        referralsRequired: parseInt(milestoneForm.referralsRequired),
      }
      if (editingMilestone) {
        await fetch(`/api/admin/milestones/${editingMilestone}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/milestones', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
      }
      setMilestoneForm({ tierNumber: '', referralsRequired: '', rewardName: '', rewardDescription: '', rewardValue: '', requiresExtraInfo: false, extraInfoLabel: '', isActive: true })
      setEditingMilestone(null)
      fetchAll()
    } finally {
      setMilestoneLoading(false)
    }
  }

  async function deleteMilestone(id: string) {
    if (!confirm('Delete this milestone?')) return
    await fetch(`/api/admin/milestones/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  function editMilestone(m: Milestone) {
    setEditingMilestone(m.id)
    setMilestoneForm({ tierNumber: String(m.tierNumber), referralsRequired: String(m.referralsRequired), rewardName: m.rewardName, rewardDescription: m.rewardDescription ?? '', rewardValue: m.rewardValue ?? '', requiresExtraInfo: m.requiresExtraInfo, extraInfoLabel: m.extraInfoLabel ?? '', isActive: m.isActive })
    setTab('milestones')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--brand-light)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading admin dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--brand)', fontWeight: 800, fontSize: 22 }}>flent</span>
            <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Admin</span>
          </div>
          <button onClick={handleLogout} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content' }}>
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'referrers', label: `Referrers${referrers.length ? ` (${referrers.length})` : ''}` },
            { id: 'redemptions', label: `Redemptions${redemptions.filter(r => r.status === 'PENDING').length ? ` 🔴 ${redemptions.filter(r => r.status === 'PENDING').length}` : ''}` },
            { id: 'milestones', label: 'Milestones' },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: tab === t.id ? 'var(--brand)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Referrers', value: stats.totalReferrers, sub: `${stats.activeReferrers} active` },
                { label: 'Total Referrals', value: stats.totalReferrals, sub: `${stats.referralsByStatus?.COMPLETED ?? 0} completed` },
                { label: 'Pending Rewards', value: stats.pendingRedemptions, sub: 'need action', alert: stats.pendingRedemptions > 0 },
                { label: 'New This Month', value: stats.recentSignups, sub: 'referrers signed up' },
              ].map((s) => (
                <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: s.alert ? '2px solid var(--danger)' : '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: s.alert ? 'var(--danger)' : 'var(--brand)' }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Referral Funnel</h3>
                {[
                  { label: 'Interested', count: stats.referralsByStatus?.INTERESTED ?? 0, color: '#F59E0B' },
                  { label: 'Agreement Signed', count: stats.referralsByStatus?.AGREEMENT_SIGNED ?? 0, color: '#3B82F6' },
                  { label: 'Completed', count: stats.referralsByStatus?.COMPLETED ?? 0, color: '#10B981' },
                  { label: 'Disqualified', count: stats.referralsByStatus?.DISQUALIFIED ?? 0, color: '#EF4444' },
                ].map((f) => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14 }}>{f.label}</span>
                    <span style={{ fontWeight: 700 }}>{f.count}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Pending Redemptions</h3>
                {redemptions.filter(r => r.status === 'PENDING').length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>No pending redemptions 🎉</p>
                ) : (
                  redemptions.filter(r => r.status === 'PENDING').slice(0, 3).map((r) => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '10px 12px', background: '#FEF3C7', borderRadius: 10 }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{r.referrer.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>{r.milestone.rewardName}</p>
                      </div>
                      <button onClick={() => setTab('redemptions')} style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Fulfil →</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Referrers ────────────────────────────────────────────────────── */}
        {tab === 'referrers' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <input type="text" placeholder="Search by name, email, phone, or code…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)' }} />
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Name', 'Code', 'Streak / Lifetime', 'Type', 'Status', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrers.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{r.email}</p>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <code style={{ background: 'var(--bg)', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>{r.referralCode}</code>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14 }}>
                          {r.progress?.currentStreakCount ?? 0} / {r.progress?.lifetimeCompletedCount ?? 0}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: r.isTenant ? '#D1FAE5' : '#EDE9FE', color: r.isTenant ? '#059669' : 'var(--brand)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                            {r.isTenant ? 'Tenant' : 'External'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: r.isDisqualified ? '#FEE2E2' : r.isActive ? '#D1FAE5' : '#F3F4F6', color: r.isDisqualified ? 'var(--danger)' : r.isActive ? 'var(--success)' : 'var(--muted)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                            {r.isDisqualified ? 'Disqualified' : r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => toggleReferrer(r.id, 'isActive', !r.isActive)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
                              {r.isActive ? 'Disable' : 'Enable'}
                            </button>
                            {!r.isDisqualified && (
                              <button onClick={() => { const note = prompt('Reason for disqualification?'); if (note) toggleReferrer(r.id, 'isDisqualified', true, note) }} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--danger)', color: 'var(--danger)', background: 'var(--surface)', cursor: 'pointer' }}>
                                Disqualify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {referrers.length === 0 && <p style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No referrers found</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Redemptions ──────────────────────────────────────────────────── */}
        {tab === 'redemptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {redemptions.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No pending redemptions</p>}
            {redemptions.map((r) => (
              <div key={r.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: r.status === 'PENDING' ? '1px solid #FCD34D' : '1px solid var(--border)' }}>
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{r.referrer.name}</h3>
                      <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{r.status}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>{r.referrer.email} · {r.referrer.phone}</p>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>Reward: {r.milestone.rewardName} (Tier {r.milestone.tierNumber})</p>
                    {r.extraInfo && Object.keys(r.extraInfo).length > 0 && (
                      <div style={{ marginTop: 8, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>Extra info:</p>
                        {Object.entries(r.extraInfo).map(([k, v]) => (
                          <p key={k} style={{ fontSize: 13 }}>{k}: {v}</p>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Requested {new Date(r.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {r.status === 'PENDING' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                      <input placeholder="Notes (optional)" value={fulfillNote} onChange={(e) => setFulfillNote(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                      <button onClick={() => fulfillRedemption(r.id, 'FULFILLED')} disabled={fulfillLoading === r.id} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        ✓ Mark Fulfilled
                      </button>
                      <button onClick={() => fulfillRedemption(r.id, 'REJECTED')} disabled={fulfillLoading === r.id} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--danger)', color: 'var(--danger)', background: 'var(--surface)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Milestones ───────────────────────────────────────────────────── */}
        {tab === 'milestones' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* List */}
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Active Milestones</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {milestones.map((m) => (
                  <div key={m.id} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Tier {m.tierNumber}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{m.rewardName}</span>
                        {!m.isActive && <span style={{ background: '#F3F4F6', color: 'var(--muted)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Inactive</span>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>{m.referralsRequired} referrals required{m.rewardValue ? ` · ${m.rewardValue}` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => editMilestone(m)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteMilestone(m.id)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--danger)', color: 'var(--danger)', background: 'var(--surface)', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))}
                {milestones.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No milestones configured yet.</p>}
              </div>
            </div>

            {/* Form */}
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{editingMilestone ? 'Edit Milestone' : 'Add Milestone'}</h3>
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Tier Number', key: 'tierNumber', type: 'number', placeholder: '1' },
                  { label: 'Referrals Required', key: 'referralsRequired', type: 'number', placeholder: '3' },
                  { label: 'Reward Name', key: 'rewardName', type: 'text', placeholder: '₹3,000 Amazon Voucher' },
                  { label: 'Description (optional)', key: 'rewardDescription', type: 'text', placeholder: 'Amazon gift card' },
                  { label: 'Value Label (optional)', key: 'rewardValue', type: 'text', placeholder: '₹3,000' },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={(milestoneForm as Record<string, unknown>)[f.key] as string} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, [f.key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={milestoneForm.requiresExtraInfo} onChange={(e) => setMilestoneForm((p) => ({ ...p, requiresExtraInfo: e.target.checked }))} />
                    Requires extra info at redemption?
                  </label>
                </div>
                {milestoneForm.requiresExtraInfo && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Extra Info Label</label>
                    <input type="text" placeholder="e.g., Delivery address" value={milestoneForm.extraInfoLabel} onChange={(e) => setMilestoneForm((p) => ({ ...p, extraInfoLabel: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                  </div>
                )}
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={milestoneForm.isActive} onChange={(e) => setMilestoneForm((p) => ({ ...p, isActive: e.target.checked }))} />
                  Active
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editingMilestone && (
                    <button onClick={() => { setEditingMilestone(null); setMilestoneForm({ tierNumber: '', referralsRequired: '', rewardName: '', rewardDescription: '', rewardValue: '', requiresExtraInfo: false, extraInfoLabel: '', isActive: true }) }} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 1 }}>Cancel</button>
                  )}
                  <button onClick={saveMilestone} disabled={milestoneLoading || !milestoneForm.rewardName || !milestoneForm.referralsRequired} style={{ padding: '10px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', flex: 2 }}>
                    {milestoneLoading ? 'Saving…' : editingMilestone ? 'Update Milestone' : 'Add Milestone'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
