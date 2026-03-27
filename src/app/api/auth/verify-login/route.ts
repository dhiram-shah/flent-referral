import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyOtp } from '@/lib/otp'
import { signReferrerToken, COOKIE_NAMES, referrerCookieOptions } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, otp } = parsed.data

  const result = await verifyOtp(email, otp)
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const referrer = await prisma.referrer.findUnique({ where: { email } })
  if (!referrer) {
    return Response.json({ error: 'Account not found.' }, { status: 404 })
  }

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
