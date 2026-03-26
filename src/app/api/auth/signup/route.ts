import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createOtpSession } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/resend'

const schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  city: z.string().optional(),
})

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
    // Already registered — resend OTP to allow re-login
    const otp = await createOtpSession(email, existing.id)
    await sendOtpEmail(email, name, otp).catch(console.error)
    return Response.json({ status: 'otp_sent', message: 'OTP sent to your email.', existing: true })
  }

  // New registration — create OTP session (account created after verification)
  const otp = await createOtpSession(email)
  await sendOtpEmail(email, name, otp).catch(console.error)

  // Store pending registration data in OTP session via a short-lived cache approach
  // We'll include the user data in the verify step via the request body
  return Response.json({ status: 'otp_sent', message: 'OTP sent to your email.' })
}
