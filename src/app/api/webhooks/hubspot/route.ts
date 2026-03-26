/**
 * HubSpot webhook handler.
 *
 * Set up in HubSpot:
 *   Settings → Integrations → Webhooks → Create webhook
 *   Subscribe to: contact.propertyChange (deal stage changes)
 *
 * Events handled:
 *   1. AGREEMENT_SIGNED — referral status → AGREEMENT_SIGNED
 *   2. TENANCY_COMPLETED — referral status → COMPLETED + milestone check
 *   3. TENANT_CREATED — auto-enroll new tenant as referrer
 *
 * HubSpot sends an array of subscription events.
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/lib/referral-code'
import {
  notifyReferralSigned,
  notifyReferralCompleted,
  notifyWelcome,
} from '@/lib/notifications'

function verifyHubspotSignature(body: string, signature: string | null, ts: string | null): boolean {
  const secret = process.env.HUBSPOT_WEBHOOK_SECRET
  if (!secret || !signature || !ts) return false
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${secret}${body}${ts}`)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

interface HubSpotEvent {
  subscriptionType: string
  objectId: number
  propertyName?: string
  propertyValue?: string
  changeSource?: string
}

export async function POST(request: NextRequest) {
  const raw = await request.text()
  const signature = request.headers.get('x-hubspot-signature-v3')
  const ts = request.headers.get('x-hubspot-request-timestamp')

  if (!verifyHubspotSignature(raw, signature, ts)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let events: HubSpotEvent[]
  try {
    events = JSON.parse(raw)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Process events in parallel
  await Promise.allSettled(events.map(handleEvent))

  return new Response('OK', { status: 200 })
}

async function handleEvent(event: HubSpotEvent): Promise<void> {
  const { subscriptionType, objectId, propertyName, propertyValue } = event

  // ── Tenant created: auto-enroll as referrer ──────────────────────────────
  if (
    subscriptionType === 'contact.creation' ||
    (subscriptionType === 'contact.propertyChange' && propertyName === 'lifecyclestage' && propertyValue === 'customer')
  ) {
    await autoEnrollTenant(objectId.toString())
    return
  }

  // ── Deal stage changes ───────────────────────────────────────────────────
  if (subscriptionType === 'deal.propertyChange' && propertyName === 'dealstage') {
    const STAGE_AGREEMENT_SIGNED = process.env.HUBSPOT_STAGE_AGREEMENT_SIGNED ?? 'agreement_signed'
    const STAGE_COMPLETED = process.env.HUBSPOT_STAGE_COMPLETED ?? 'tenancy_completed'

    if (propertyValue === STAGE_AGREEMENT_SIGNED) {
      await handleAgreementSigned(objectId.toString())
    } else if (propertyValue === STAGE_COMPLETED) {
      await handleTenancyCompleted(objectId.toString())
    }
    return
  }
}

async function autoEnrollTenant(hubspotContactId: string): Promise<void> {
  // Fetch contact details from HubSpot API
  const contactData = await fetchHubspotContact(hubspotContactId)
  if (!contactData) return

  const { name, email, phone } = contactData
  if (!email || !phone) return

  // Check if already a referrer
  const existing = await prisma.referrer.findFirst({
    where: { OR: [{ email }, { phone }] },
  })
  if (existing) return

  let referralCode = generateReferralCode(name)
  let attempts = 0
  while (await prisma.referrer.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode(name)
    if (++attempts > 10) return
  }

  const referrer = await prisma.referrer.create({
    data: {
      name,
      email,
      phone,
      referralCode,
      isTenant: true,
      progress: { create: { currentStreakCount: 0, lifetimeCompletedCount: 0 } },
    },
  })

  notifyWelcome(referrer, referralCode).catch(console.error)
}

async function handleAgreementSigned(hubspotDealId: string): Promise<void> {
  // Find referral by hubspot deal ID
  const referral = await prisma.referral.findFirst({
    where: { hubspotId: hubspotDealId, isDisqualified: false },
    include: { referrer: true },
  })
  if (!referral || referral.status !== 'INTERESTED') return

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: 'AGREEMENT_SIGNED', signedAt: new Date() },
  })

  notifyReferralSigned(referral.referrer, referral.refereeName).catch(console.error)
}

async function handleTenancyCompleted(hubspotDealId: string): Promise<void> {
  const referral = await prisma.referral.findFirst({
    where: { hubspotId: hubspotDealId, isDisqualified: false },
    include: { referrer: { include: { progress: true } } },
  })
  if (!referral || referral.status === 'COMPLETED') return

  const newStreakCount = (referral.referrer.progress?.currentStreakCount ?? 0) + 1
  const newLifetimeCount = (referral.referrer.progress?.lifetimeCompletedCount ?? 0) + 1

  // Find what milestone was unlocked (if any)
  const unlockedMilestone = await prisma.milestoneConfig.findFirst({
    where: { isActive: true, referralsRequired: newStreakCount },
    orderBy: { tierNumber: 'asc' },
  })

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    }),
    prisma.referrerProgress.update({
      where: { referrerId: referral.referrerId },
      data: { currentStreakCount: newStreakCount, lifetimeCompletedCount: newLifetimeCount },
    }),
  ])

  notifyReferralCompleted(
    referral.referrer,
    referral.refereeName,
    unlockedMilestone?.rewardName
  ).catch(console.error)
}

async function fetchHubspotContact(
  contactId: string
): Promise<{ name: string; email: string; phone: string } | null> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN
  if (!token) return null

  try {
    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const props = data.properties
    return {
      name: `${props.firstname ?? ''} ${props.lastname ?? ''}`.trim() || 'Flent Tenant',
      email: props.email ?? '',
      phone: props.phone ?? '',
    }
  } catch {
    return null
  }
}
