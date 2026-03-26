'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="flent" style={{ height: 26, display: 'block', margin: '0 auto' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Admin Portal</p>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '36px 32px', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Sign in</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 15, background: 'var(--bg)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 15, background: 'var(--bg)' }} />
            </div>
            {error && <div style={{ background: '#FEF2F2', color: 'var(--danger)', fontSize: 13, padding: '10px 14px', borderRadius: 8 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#7B93AB' : 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
