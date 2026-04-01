'use client'

import { useState, useEffect } from 'react'
const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  info:    { color: 'var(--info)',    bg: 'var(--info-light)' },
  success: { color: 'var(--success)', bg: 'var(--success-light)' },
  brand:   { color: 'var(--brand)',   bg: 'var(--pastel-violet)' },
  warning: { color: '#D97706',        bg: '#FEF3C7' },
}

interface Tier {
  id: number
  name: string
  minReferrals: number
  colorToken: string
  sortOrder: number
}

const COLOR_OPTIONS = [
  { value: 'info',    label: 'Blue (Info)' },
  { value: 'success', label: 'Green (Success)' },
  { value: 'brand',   label: 'Navy (Brand)' },
  { value: 'warning', label: 'Amber (Warning)' },
]

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontSize: 13,
  background: 'var(--bg)',
  color: 'var(--text)',
}

export default function TiersTab() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', minReferrals: '', colorToken: 'brand', sortOrder: '' })
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', minReferrals: '', colorToken: 'brand', sortOrder: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/ambassador-tiers')
      .then((r) => r.json())
      .then((d) => setTiers(d.tiers ?? []))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(t: Tier) {
    setEditing(t.id)
    setForm({ name: t.name, minReferrals: String(t.minReferrals), colorToken: t.colorToken, sortOrder: String(t.sortOrder) })
    setMsg('')
  }

  function cancelEdit() {
    setEditing(null)
    setMsg('')
  }

  async function saveEdit(id: number) {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch(`/api/admin/ambassador-tiers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          minReferrals: parseInt(form.minReferrals),
          colorToken: form.colorToken,
          sortOrder: parseInt(form.sortOrder) || 0,
        }),
      })
      if (!res.ok) { setMsg('Save failed.'); return }
      const { tier } = await res.json()
      setTiers((prev) => prev.map((t) => (t.id === id ? tier : t)))
      setEditing(null)
      setMsg('Saved!')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTier(id: number, name: string) {
    if (!confirm(`Delete "${name}"? Referrers at this tier will lose the badge until thresholds are reconfigured.`)) return
    await fetch(`/api/admin/ambassador-tiers/${id}`, { method: 'DELETE' })
    setTiers((prev) => prev.filter((t) => t.id !== id))
  }

  async function addTier() {
    if (!addForm.name.trim() || !addForm.minReferrals) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ambassador-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          minReferrals: parseInt(addForm.minReferrals),
          colorToken: addForm.colorToken,
          sortOrder: parseInt(addForm.sortOrder) || tiers.length + 1,
        }),
      })
      if (!res.ok) return
      const { tier } = await res.json()
      setTiers((prev) => [...prev, tier].sort((a, b) => a.sortOrder - b.sortOrder))
      setAdding(false)
      setAddForm({ name: '', minReferrals: '', colorToken: 'brand', sortOrder: '' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)', padding: 24 }}>Loading tiers…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Ambassador Tiers</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              Tiers are computed from lifetime referral count. Changes take effect immediately.
            </p>
          </div>
          <button onClick={() => { setAdding(true); setMsg('') }} className="btn-base btn-pastel-violet" style={{ fontSize: 13, padding: '8px 18px' }}>
            + Add tier
          </button>
        </div>

        {msg && (
          <p style={{ fontSize: 13, color: msg === 'Saved!' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>{msg}</p>
        )}

        {/* Tier list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tiers.map((t) => {
            const colors = TIER_COLORS[t.colorToken] ?? TIER_COLORS.brand
            return (
              <div key={t.id} style={{ background: 'var(--surface)', borderRadius: 14, border: editing === t.id ? `1.5px solid ${colors.color}` : '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ background: colors.bg, color: colors.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 1, border: `1px solid ${colors.color}`, whiteSpace: 'nowrap' }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {t.minReferrals}+ lifetime referrals
                    </span>
                  </div>
                  {editing !== t.id && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(t)} className="btn-base btn-pastel-violet" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button>
                      <button
                        onClick={() => deleteTier(t.id, t.name)}
                        className="btn-base btn-pastel-peach"
                        style={{ fontSize: 12, padding: '6px 14px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {editing === t.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px 18px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Tier name</label>
                      <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, width: 140 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Min referrals</label>
                      <input type="number" min={1} value={form.minReferrals} onChange={(e) => setForm((f) => ({ ...f, minReferrals: e.target.value }))} style={{ ...inputStyle, width: 100 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Color</label>
                      <select value={form.colorToken} onChange={(e) => setForm((f) => ({ ...f, colorToken: e.target.value }))} style={{ ...inputStyle }}>
                        {COLOR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Sort order</label>
                      <input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} style={{ ...inputStyle, width: 80 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => saveEdit(t.id)} disabled={saving || !form.name.trim()} className="btn-base btn-pill" style={{ padding: '8px 20px', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={cancelEdit} className="btn-base btn-pastel-peach" style={{ padding: '8px 16px', fontSize: 13 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add tier form */}
        {adding && (
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1.5px solid var(--brand)', padding: '16px 18px 18px', marginTop: 8 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>New tier</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Tier name</label>
                <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Legend" style={{ ...inputStyle, width: 140 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Min referrals</label>
                <input type="number" min={1} value={addForm.minReferrals} onChange={(e) => setAddForm((f) => ({ ...f, minReferrals: e.target.value }))} placeholder="10" style={{ ...inputStyle, width: 100 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Color</label>
                <select value={addForm.colorToken} onChange={(e) => setAddForm((f) => ({ ...f, colorToken: e.target.value }))} style={{ ...inputStyle }}>
                  {COLOR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addTier} disabled={saving || !addForm.name.trim() || !addForm.minReferrals} className="btn-base btn-pill" style={{ padding: '8px 20px', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Adding…' : 'Add'}
                </button>
                <button onClick={() => setAdding(false)} className="btn-base btn-pastel-peach" style={{ padding: '8px 16px', fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', padding: '14px 18px', fontSize: 13 }}>
        <p style={{ fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>How tiers work</p>
        <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
          <li>Tier badges are computed from a referrer&apos;s <strong>lifetime completed referral count</strong> — not streak.</li>
          <li>Changing thresholds takes effect immediately for all referrers.</li>
          <li>The highest tier a referrer qualifies for is shown on their dashboard.</li>
          <li>Tier names also appear on the quarterly leaderboard next to opted-in users.</li>
        </ul>
      </div>
    </div>
  )
}
