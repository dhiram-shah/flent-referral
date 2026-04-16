import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto, { createPublicKey } from 'crypto'

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

// ─── Google ID token verification ─────────────────────────────────────────────

interface GoogleTokenPayload {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
}

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
let cachedCerts: { keys: Record<string, unknown>[] } | null = null
let cachedAt = 0

async function getGoogleCerts() {
  if (cachedCerts && Date.now() - cachedAt < 3600_000) return cachedCerts
  const res = await fetch(GOOGLE_CERTS_URL)
  cachedCerts = await res.json()
  cachedAt = Date.now()
  return cachedCerts!
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    const decoded = jwt.decode(idToken, { complete: true })
    if (!decoded) return null

    const { kid } = decoded.header
    const certs = await getGoogleCerts()
    const jwk = certs.keys.find((k) => k.kid === kid)
    if (!jwk) return null

    const pem = createPublicKey({ key: jwk as crypto.JsonWebKeyInput['key'], format: 'jwk' })
      .export({ type: 'spki', format: 'pem' }) as string

    const payload = jwt.verify(idToken, pem, {
      algorithms: ['RS256'],
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    }) as GoogleTokenPayload

    if (!payload.email_verified) return null
    return payload
  } catch {
    return null
  }
}

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
