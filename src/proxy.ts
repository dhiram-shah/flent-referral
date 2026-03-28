import { NextRequest, NextResponse } from 'next/server'
import { verifyReferrerToken, verifyAdminToken, COOKIE_NAMES } from '@/lib/auth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Dev bypass — skip all auth checks in local development ────────────────
  if (process.env.NODE_ENV !== 'production') return NextResponse.next()

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE_NAMES.ADMIN)?.value
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Referrer dashboard ────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get(COOKIE_NAMES.REFERRER)?.value
    if (!token || !verifyReferrerToken(token)) {
      return NextResponse.redirect(new URL('/signup', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
