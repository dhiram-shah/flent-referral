import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const REFERRER_SECRET = process.env.JWT_SECRET!
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET!
const COOKIE_REFERRER = 'flent_ref_token'
const COOKIE_ADMIN = 'flent_admin_token'

// ─── Referrer auth ────────────────────────────────────────────────────────────

export function signReferrerToken(referrerId: string): string {
  return jwt.sign({ sub: referrerId, type: 'referrer' }, REFERRER_SECRET, { expiresIn: '30d' })
}

export function verifyReferrerToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, REFERRER_SECRET) as { sub: string }
  } catch {
    return null
  }
}

// ─── Admin auth ───────────────────────────────────────────────────────────────

export function signAdminToken(adminId: string, role: string): string {
  return jwt.sign({ sub: adminId, type: 'admin', role }, ADMIN_SECRET, { expiresIn: '8h' })
}

export function verifyAdminToken(token: string): { sub: string; role: string } | null {
  try {
    return jwt.verify(token, ADMIN_SECRET) as { sub: string; role: string }
  } catch {
    return null
  }
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── Cookie names ─────────────────────────────────────────────────────────────

export const COOKIE_NAMES = { REFERRER: COOKIE_REFERRER, ADMIN: COOKIE_ADMIN }

// ─── Cookie options ───────────────────────────────────────────────────────────

export const referrerCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 8, // 8 hours
  path: '/',
}
