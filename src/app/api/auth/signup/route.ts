import { NextRequest, after } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createOtpSession } from '@/lib/otp'
import { notifyOtp } from '@/lib/notifications'

const schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  city: z.string().optional(),
})

function cooldownResponse(err: unknown): Response | null {
  if (err instanceof Error && err.message.startsWith('COOLDOWN:')) {
    const remaining = parseInt(err.message.split(':')[1])
    return Response.json(
      { error: `Please wait ${remaining}s before requesting another code.`, cooldown: remaining },
      { status: 429 }
    )
  }
  return null
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, phone, email, city } = parsed.data

  // Check if already registered
  const existing = await prisma.referrer.findFirst({
    where: { OR: [{ email }, { phone }] },
  })

  if (existing) {
    if (existing.isDisqualified) {
      return Response.json(
        { error: 'This account has been suspended. Contact sales@flent.in for help.' },
        { status: 403 }
      )
    }
    // Already registered — send OTP to allow re-login
    let otp: string
    try {
      otp = await createOtpSession(email, existing.id)
    } catch (err) {
      const res = cooldownResponse(err)
      if (res) return res
      throw err
    }
    after(() => notifyOtp({ email, phone: existing.phone, name: existing.name, otp, referrerId: existing.id }).catch(console.error))
    return Response.json({ status: 'otp_sent', message: 'OTP sent to your email.', existing: true })
  }

  // New registration — create OTP session (account created after verification)
  let otp: string
  try {
    otp = await createOtpSession(email)
  } catch (err) {
    const res = cooldownResponse(err)
    if (res) return res
    throw err
  }

  after(() => notifyOtp({ email, phone, name, otp }).catch(console.error))
  return Response.json({ status: 'otp_sent', message: 'OTP sent to your email.' })
}
