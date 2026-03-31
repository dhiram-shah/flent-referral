'use client'

import { useState, useEffect } from 'react'

interface CommTemplate {
  key: string
  label: string
  channel: string
  subject?: string | null
  body: string
  variables: string[]
  updatedAt: string
  updatedBy?: string | null
}

const CHANNEL_META: Record<string, { label: string; color: string; bg: string; hint: string }> = {
  EMAIL: { label: 'Email', color: 'var(--info)', bg: 'var(--info-light)', hint: 'Full HTML body. Use {{variable}} placeholders.' },
  WHATSAPP: { label: 'WhatsApp', color: 'var(--success)', bg: 'var(--success-light)', hint: 'Superchat template name (pre-approved in your WA Business account).' },
  UI: { label: 'UI Text', color: 'var(--brand)', bg: 'var(--pastel-violet)', hint: 'Shown to users in-app. Use {{variable}} placeholders.' },
}

const CHANNEL_ORDER = ['EMAIL', 'WHATSAPP', 'UI']

export default function CommsTab() {
  const [templates, setTemplates] = useState<CommTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/comms')
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(tpl: CommTemplate) {
    setEditing(tpl.key)
    setForm({ subject: tpl.subject ?? '', body: tpl.body })
    setSaveMsg('')
  }

  function cancelEdit() {
    setEditing(null)
    setSaveMsg('')
  }

  async function save(key: string) {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/admin/comms/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: form.subject || null, body: form.body }),
      })
      if (!res.ok) { setSaveMsg('Save failed — please try again.'); return }
      const { template } = await res.json()
      setTemplates((prev) => prev.map((t) => (t.key === key ? { ...t, ...template } : t)))
      setSaveMsg('Saved!')
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--muted)', padding: 24 }}>Loading templates…</p>
  }

  const grouped = CHANNEL_ORDER.reduce<Record<string, CommTemplate[]>>((acc, ch) => {
    acc[ch] = templates.filter((t) => t.channel === ch)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {CHANNEL_ORDER.map((channel) => {
        const meta = CHANNEL_META[channel]
        const group = grouped[channel] ?? []
        if (!group.length) return null

        return (
          <div key={channel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 1, border: '1px solid var(--brand)' }}>
                {meta.label}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{meta.hint}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.map((tpl) => (
                <div key={tpl.key} style={{ background: 'var(--surface)', borderRadius: 14, border: editing === tpl.key ? `1.5px solid ${meta.color}` : '1px solid var(--border)', overflow: 'hidden' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{tpl.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>{tpl.key}</p>
                      {tpl.updatedBy && (
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          Last edited by {tpl.updatedBy} · {new Date(tpl.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    {editing !== tpl.key && (
                      <button onClick={() => startEdit(tpl)} className="btn-base btn-pastel-violet" style={{ fontSize: 13, padding: '7px 16px' }}>
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Edit form */}
                  {editing === tpl.key && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '18px 18px 20px' }}>
                      {/* Variables hint */}
                      {tpl.variables.length > 0 && (
                        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Available variables: </span>
                          {tpl.variables.map((v) => (
                            <code key={v} style={{ background: '#EDE9FE', color: '#7C3AED', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>
                              {tpl.channel === 'WHATSAPP' ? v : `{{${v}}}`}
                            </code>
                          ))}
                        </div>
                      )}

                      {/* Subject (email only) */}
                      {tpl.channel === 'EMAIL' && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Subject line</label>
                          <input
                            value={form.subject}
                            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }}
                          />
                        </div>
                      )}

                      {/* Body */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                          {tpl.channel === 'EMAIL' ? 'HTML body' : tpl.channel === 'WHATSAPP' ? 'Template name' : 'Message text'}
                        </label>
                        <textarea
                          value={form.body}
                          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                          rows={tpl.channel === 'EMAIL' ? 14 : tpl.channel === 'UI' ? 4 : 2}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: tpl.channel === 'EMAIL' ? 'monospace' : 'inherit', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
                        />
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={() => save(tpl.key)}
                          disabled={saving || !form.body.trim()}
                          className="btn-base btn-pill"
                          style={{ padding: '9px 22px', fontSize: 13, opacity: saving ? 0.7 : 1 }}
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn-base btn-pastel-peach"
                          style={{ padding: '9px 18px', fontSize: 13 }}
                        >
                          Cancel
                        </button>
                        {saveMsg && (
                          <span style={{ fontSize: 13, color: saveMsg === 'Saved!' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                            {saveMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
