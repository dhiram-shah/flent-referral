import { NextRequest, NextResponse } from 'next/server'

// ── Dev-only: never available in production ──────────────────────────────────
// Sets a simple bypass cookie accepted by proxy.ts in non-production.
// No DB or JWT needed — works even without .env.local configured.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const role = request.nextUrl.searchParams.get('role') ?? 'referrer'
  const redirectTo = request.nextUrl.searchParams.get('redirect') ?? (role === 'admin' ? '/admin' : '/dashboard')

  const res = NextResponse.redirect(new URL(redirectTo, request.url))
  res.cookies.set('flent_dev_bypass', role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return res
}
