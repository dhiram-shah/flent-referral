import { notFound } from 'next/navigation'

export default function DevPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const links: { label: string; href: string; color: string }[] = [
    { label: '→ Landing page', href: '/', color: '#E5E7EB' },
    { label: '→ Sign up (form)', href: '/signup', color: '#E5E7EB' },
    { label: '→ Login (form)', href: '/login', color: '#E5E7EB' },
    { label: '→ Dashboard (as referrer)', href: '/api/dev/login?role=referrer', color: '#dad7f4' },
    { label: '→ Admin panel (as admin)', href: '/api/dev/login?role=admin', color: '#ffe2d8' },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-block', background: '#22c55e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, letterSpacing: 1, marginBottom: 16 }}>
            DEV ONLY
          </div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Screen shortcuts</h1>
          <p style={{ color: '#737373', fontSize: 14, marginTop: 6 }}>
            Jump to any screen. Auth routes use the first DB record (or create a test one).
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                display: 'block',
                background: l.color,
                color: '#15102E',
                padding: '14px 20px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                border: '1.5px solid rgba(21,16,46,0.12)',
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <p style={{ color: '#525252', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
          Not visible in production — returns 404.
        </p>
      </div>
    </main>
  )
}
