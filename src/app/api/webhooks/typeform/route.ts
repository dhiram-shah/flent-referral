/**
 * Typeform webhook — fires when a prospective tenant submits the inquiry form.
 * Extracts the referral code field and creates a referral record.
 *
 * Verify your webhook in Typeform:
 *   Dashboard → Connect → Webhooks → Add webhook
 *   URL: https://your-domain.com/api/webhooks/typeform
 *   Secret: set in TYPEFORM_WEBHOOK_SECRET env var
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { notifyReferralInterested } from '@/lib/notifications'

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.TYPEFORM_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('base64')}`
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const raw = await request.text()
  const signature = request.headers.get('typeform-signature')

  if (!verifySignature(raw, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const answers = (payload.form_response as Record<string, unknown>)?.answers as Array<{
    field: { id: string; ref: string }
    type: string
    text?: string
    phone_number?: string
    email?: string
  }>

  if (!answers?.length) {
    return new Response('No answers', { status: 200 })
  }

  const referralCodeFieldId = process.env.TYPEFORM_REFERRAL_CODE_FIELD_ID ?? ''

  // Extract field values
  const getField = (fieldId: string) =>
    answers.find((a) => a.field.id === fieldId || a.field.ref === fieldId)

  const referralCodeAnswer = getField(referralCodeFieldId)
  const referralCode = referralCodeAnswer?.text?.trim().toUpperCase()

  if (!referralCode) {
    // No referral code entered — that's fine, not a referred lead
    return new Response('OK', { status: 200 })
  }

  // Extract referee details from form (adjust field refs to match your Typeform)
  const nameAnswer = answers.find((a) => a.type === 'short_text' || a.type === 'text')
  const phoneAnswer = answers.find((a) => a.type === 'phone_number')
  const emailAnswer = answers.find((a) => a.type === 'email')

  const refereeName = nameAnswer?.text ?? 'Someone'
  const refereePhone = phoneAnswer?.phone_number ?? ''
  const refereeEmail = emailAnswer?.email ?? ''

  // Validate referral code
  const referrer = await prisma.referrer.findUnique({
    where: { referralCode },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      isDisqualified: true,
    },
  })

  if (!referrer || !referrer.isActive || referrer.isDisqualified) {
    // Invalid code — don't block the form submission, just skip
    return new Response('OK', { status: 200 })
  }

  // Fraud check: referee cannot be the referrer
  const isSelfReferral =
    refereePhone === referrer.phone ||
    (refereeEmail && refereeEmail.toLowerCase() === referrer.email.toLowerCase())

  if (isSelfReferral) {
    // Mark for review but don't block
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeName,
        refereePhone,
        refereeEmail,
        isDisqualified: true,
        disqualifyNote: 'Self-referral detected',
        ipAddress: request.headers.get('x-forwarded-for') ?? '',
      },
    })
    return new Response('OK', { status: 200 })
  }

  // Check for duplicate phone (already a referral from this number)
  const existingReferral = await prisma.referral.findFirst({
    where: { refereePhone, isDisqualified: false },
    select: { id: true },
  })

  if (existingReferral) {
    return new Response('OK', { status: 200 })
  }

  // Create referral
  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      refereeName,
      refereePhone,
      refereeEmail,
      ipAddress: request.headers.get('x-forwarded-for') ?? '',
    },
  })

  // Notify referrer (non-blocking)
  notifyReferralInterested(referrer, refereeName).catch(console.error)

  return new Response('OK', { status: 200 })
}
