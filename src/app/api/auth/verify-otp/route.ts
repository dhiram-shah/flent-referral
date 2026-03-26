import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyOtp } from '@/lib/otp'
import {
  signReferrerToken,
  COOKIE_NAMES,
  referrerCookieOptions,
} from '@/lib/auth'
import { generateReferralCode } from '@/lib/referral-code'
import { notifyWelcome } from '@/lib/notifications'

const schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  city: z.string().optional(),
  otp: z.string().length(6),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { name, phone, email, city, otp } = parsed.data

  const result = await verifyOtp(email, otp)
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  // Check if referrer already exists (returning user)
  let referrer = await prisma.referrer.findUnique({ where: { email } })

  if (!referrer) {
    // Check phone uniqueness
    const phoneExists = await prisma.referrer.findUnique({ where: { phone } })
    if (phoneExists) {
      return Response.json({ error: 'This phone number is already registered.' }, { status: 409 })
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(name)
    let attempts = 0
    while (await prisma.referrer.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode(name)
      if (++attempts > 10) throw new Error('Could not generate unique referral code')
    }

    // Create referrer + progress record
    referrer = await prisma.referrer.create({
      data: {
        name,
        phone,
        email,
        city,
        referralCode,
        progress: {
          create: { currentStreakCount: 0, lifetimeCompletedCount: 0 },
        },
      },
    })

    // Fire welcome notifications async (don't block response)
    notifyWelcome(referrer, referralCode).catch(console.error)
  }

  // Issue JWT cookie
  const token = signReferrerToken(referrer.id)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAMES.REFERRER, token, referrerCookieOptions)

  return Response.json({
    status: 'success',
    referrer: {
      id: referrer.id,
      name: referrer.name,
      referralCode: referrer.referralCode,
    },
  })
}
