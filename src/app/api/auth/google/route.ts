import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import {
  verifyGoogleIdToken,
  signReferrerToken,
  COOKIE_NAMES,
  referrerCookieOptions,
} from '@/lib/auth'
import { generateReferralCode } from '@/lib/referral-code'
import { notifyWelcome } from '@/lib/notifications'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const credential = body?.credential as string | undefined

  if (!credential) {
    return Response.json({ error: 'Missing Google credential' }, { status: 400 })
  }

  const payload = await verifyGoogleIdToken(credential)
  if (!payload) {
    return Response.json({ error: 'Invalid or expired Google token' }, { status: 401 })
  }

  const { email, sub: googleId, name } = payload

  // Check if referrer exists by googleId or email
  let referrer = await prisma.referrer.findFirst({
    where: { OR: [{ googleId }, { email }] },
  })

  let isNew = false

  if (referrer) {
    if (referrer.isDisqualified) {
      return Response.json(
        { error: 'This account has been suspended. Contact sales@flent.in for help.' },
        { status: 403 }
      )
    }

    // Link Google ID if existing OTP user signs in with Google for the first time
    if (!referrer.googleId) {
      referrer = await prisma.referrer.update({
        where: { id: referrer.id },
        data: { googleId },
      })
    }
  } else {
    isNew = true

    // Generate unique referral code
    const displayName = name || email.split('@')[0]
    let referralCode = generateReferralCode(displayName)
    let attempts = 0
    while (await prisma.referrer.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode(displayName)
      if (++attempts > 10) throw new Error('Could not generate unique referral code')
    }

    referrer = await prisma.referrer.create({
      data: {
        name: displayName,
        email,
        googleId,
        authMethod: 'google',
        referralCode,
        progress: {
          create: { currentStreakCount: 0, lifetimeCompletedCount: 0 },
        },
      },
    })

    notifyWelcome(referrer, referralCode).catch(console.error)
  }

  // Issue JWT cookie
  const token = signReferrerToken(referrer.id)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAMES.REFERRER, token, referrerCookieOptions)

  return Response.json({
    status: 'success',
    isNew,
    referrer: {
      id: referrer.id,
      name: referrer.name,
      referralCode: referrer.referralCode,
    },
  })
}
