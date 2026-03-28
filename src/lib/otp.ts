import { randomInt } from 'crypto'
import { prisma } from './prisma'

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 3
const RESEND_COOLDOWN_SECONDS = 60

export function generateOtp(): string {
  return randomInt(100000, 999999).toString()
}

export async function createOtpSession(email: string, referrerId?: string): Promise<string> {
  // Rate-limit: block new OTP if one was sent within the cooldown window
  const cooldownCutoff = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000)
  const recent = await prisma.otpSession.findFirst({
    where: { email, verified: false, createdAt: { gte: cooldownCutoff } },
    orderBy: { createdAt: 'desc' },
  })
  if (recent) {
    const elapsed = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000)
    const remaining = RESEND_COOLDOWN_SECONDS - elapsed
    throw Object.assign(new Error(`COOLDOWN:${remaining}`), { code: 'COOLDOWN' })
  }

  // Invalidate any existing unverified sessions for this email
  await prisma.otpSession.updateMany({
    where: { email, verified: false },
    data: { attempts: MAX_ATTEMPTS }, // exhaust them
  })

  const otp = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpSession.create({
    data: { email, otp, expiresAt, referrerId },
  })

  return otp
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const session = await prisma.otpSession.findFirst({
    where: { email, verified: false },
    orderBy: { createdAt: 'desc' },
  })

  if (!session) return { success: false, error: 'No OTP found. Please request a new one.' }

  if (new Date() > session.expiresAt) {
    return { success: false, error: 'OTP expired. Please request a new one.' }
  }

  if (session.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'Too many attempts. Please request a new OTP.' }
  }

  if (session.otp !== otp) {
    await prisma.otpSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    })
    const remaining = MAX_ATTEMPTS - session.attempts - 1
    return { success: false, error: `Incorrect OTP. ${remaining} attempt(s) remaining.` }
  }

  await prisma.otpSession.update({
    where: { id: session.id },
    data: { verified: true },
  })

  return { success: true }
}
