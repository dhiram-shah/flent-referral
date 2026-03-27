import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createOtpSession } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/resend'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const { email } = parsed.data

  const referrer = await prisma.referrer.findUnique({ where: { email } })

  if (!referrer) {
    return Response.json(
      { error: 'No account found with this email. Would you like to sign up instead?' },
      { status: 404 }
    )
  }

  if (referrer.isDisqualified) {
    return Response.json(
      { error: 'This account has been suspended. Contact sales@flent.in for help.' },
      { status: 403 }
    )
  }

  const otp = await createOtpSession(email, referrer.id)
  await sendOtpEmail(email, referrer.name, otp).catch(console.error)

  return Response.json({ status: 'otp_sent' })
}
