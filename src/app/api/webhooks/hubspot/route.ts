/**
 * HubSpot webhook handler — contact-based, no deals.
 *
 * Set up in HubSpot:
 *   Settings → Integrations → Webhooks → Create webhook
 *   URL: https://flent-referral.vercel.app/api/webhooks/hubspot
 *   Subscribe to contact.propertyChange for:
 *     - token_payment_status
 *     - first_month_rent
 *     - tenant_security_deposit
 *     - customer_type  (auto-enrolls referrer when value = "Tenant"; upgrades existing referrer to isTenant=true)
 *
 * Flow:
 *   Typeform fill            → INTERESTED  (Typeform webhook)
 *   token_payment_status=Paid → AGREEMENT_SIGNED
 *   first_month_rent=Paid
 *     + tenant_security_deposit=Paid
 *     + move_in_date ≤ today  → COMPLETED
 *
 * Match key: referral.refereeEmail = HubSpot contact email
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

// ── Signature verification ───────────────────────────────────────────────────

function verifyHubspotSignature(
  body: string,
  method: string,
  uri: string,
  signature: string | null,
  ts: string | null,
): boolean {
  const secret = process.env.HUBSPOT_WEBHOOK_SECRET
  if (!secret || !signature || !ts) return false
  if (Math.abs(Date.now() - Number(ts)) > 300_000) return false
  const hash = crypto
    .createHmac('sha256', secret)
    .update(method + uri + body + ts)
    .digest('base64')
  const expected = Buffer.from(hash)
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false
  return crypto.timingSafeEqual(expected, actual)
}

// ── HubSpot API ──────────────────────────────────────────────────────────────

interface HubSpotContact {
  email: string
  name: string
  phone: string
  tokenPaymentStatus: string | null
  firstMonthRent: string | null
  securityDeposit: string | null
  moveInDate: string | null
}

async function fetchContact(contactId: string): Promise<HubSpotContact | null> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN
  if (!token) return null

  const props = 'firstname,lastname,email,phone,token_payment_status,first_month_rent,tenant_security_deposit,move_in_date'

  try {
    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=${props}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const p = data.properties
    return {
      email: p.email ?? '',
      name: `${p.firstname ?? ''} ${p.lastname ?? ''}`.trim() || 'Flent Tenant',
      phone: p.phone ?? '',
      tokenPaymentStatus: p.token_payment_status ?? null,
      firstMonthRent: p.first_month_rent ?? null,
      securityDeposit: p.tenant_security_deposit ?? null,
      moveInDate: p.move_in_date ?? null,
    }
  } catch {
    return null
  }
}

export async function searchContactByEmail(email: string): Promise<HubSpotContact | null> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN
  if (!token) return null

  const props = 'firstname,lastname,email,phone,token_payment_status,first_month_rent,tenant_security_deposit,move_in_date'

  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
        properties: props.split(','),
        limit: 1,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const result = data.results?.[0]
    if (!result) return null
    const p = result.properties
    return {
      email: p.email ?? '',
      name: `${p.firstname ?? ''} ${p.lastname ?? ''}`.trim() || 'Flent Tenant',
      phone: p.phone ?? '',
      tokenPaymentStatus: p.token_payment_status ?? null,
      firstMonthRent: p.first_month_rent ?? null,
      securityDeposit: p.tenant_security_deposit ?? null,
      moveInDate: p.move_in_date ?? null,
    }
  } catch {
    return null
  }
}

/** HubSpot date properties come back as Unix-ms strings or ISO date strings */
function isMoveInDatePassed(moveInDate: string): boolean {
  const date = isNaN(Number(moveInDate))
    ? new Date(moveInDate)
    : new Date(Number(moveInDate))
  return date <= new Date()
}

// ── Referral helpers ─────────────────────────────────────────────────────────

type ReferralForCompletion = {
  id: string
  status: string
  referrerId: string
  refereeName: string
  referrer: {
    id: string; name: string; email: string; phone: string
    progress: { currentStreakCount: number; lifetimeCompletedCount: number } | null
  }
}

async function findReferralByEmail(email: string): Promise<ReferralForCompletion | null> {
  return prisma.referral.findFirst({
    where: { refereeEmail: email, isDisqualified: false, status: { not: 'COMPLETED' } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, status: true, referrerId: true, refereeName: true,
      referrer: {
        select: {
          id: true, name: true, email: true, phone: true,
          progress: { select: { currentStreakCount: true, lifetimeCompletedCount: true } },
        },
      },
    },
  })
}

export async function markReferralCompleted(referral: ReferralForCompletion): Promise<void> {
  const newStreakCount = (referral.referrer.progress?.currentStreakCount ?? 0) + 1
  const newLifetimeCount = (referral.referrer.progress?.lifetimeCompletedCount ?? 0) + 1

  const unlockedMilestone = await prisma.milestoneConfig.findFirst({
    where: { isActive: true, referralsRequired: newStreakCount },
    orderBy: { tierNumber: 'asc' },
  })

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    }),
    prisma.referrerProgress.upsert({
      where: { referrerId: referral.referrerId },
      update: { currentStreakCount: newStreakCount, lifetimeCompletedCount: newLifetimeCount },
      create: { referrerId: referral.referrerId, currentStreakCount: newStreakCount, lifetimeCompletedCount: newLifetimeCount },
    }),
  ])

  notifyReferralCompleted(referral.referrer, referral.refereeName, unlockedMilestone?.rewardName)
    .catch(console.error)
}

// ── Event handlers ───────────────────────────────────────────────────────────

async function handleTokenPaid(hubspotContactId: string): Promise<void> {
  const contact = await fetchContact(hubspotContactId)
  if (!contact?.email) return

  const referral = await findReferralByEmail(contact.email)
  if (!referral || referral.status !== 'INTERESTED') return

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: 'AGREEMENT_SIGNED', signedAt: new Date() },
  })

  notifyReferralSigned(referral.referrer, referral.refereeName).catch(console.error)
}

async function checkPaymentSettled(hubspotContactId: string): Promise<void> {
  const contact = await fetchContact(hubspotContactId)
  if (!contact?.email) return

  // Both payments must be Paid
  if (contact.firstMonthRent !== 'Paid' || contact.securityDeposit !== 'Paid') return

  // Move-in date must have passed
  if (!contact.moveInDate || !isMoveInDatePassed(contact.moveInDate)) return

  const referral = await findReferralByEmail(contact.email)
  if (!referral || referral.status !== 'AGREEMENT_SIGNED') return

  await markReferralCompleted(referral)
}

async function autoEnrollTenant(hubspotContactId: string): Promise<void> {
  const contact = await fetchContact(hubspotContactId)
  if (!contact?.email || !contact.phone) return

  const existing = await prisma.referrer.findFirst({
    where: { OR: [{ email: contact.email }, { phone: contact.phone }] },
  })

  // Already a referrer — just mark them as a tenant if not already
  if (existing) {
    if (!existing.isTenant) {
      await prisma.referrer.update({ where: { id: existing.id }, data: { isTenant: true } })
    }
    return
  }

  // New referrer — create with isTenant: true
  let referralCode = generateReferralCode(contact.name)
  let attempts = 0
  while (await prisma.referrer.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode(contact.name)
    if (++attempts > 10) return
  }

  const referrer = await prisma.referrer.create({
    data: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      referralCode,
      isTenant: true,
      progress: { create: { currentStreakCount: 0, lifetimeCompletedCount: 0 } },
    },
  })

  notifyWelcome(referrer, referralCode).catch(console.error)
}

// ── Webhook route ────────────────────────────────────────────────────────────

interface HubSpotEvent {
  subscriptionType: string
  objectId: number
  propertyName?: string
  propertyValue?: string
}

async function handleEvent(event: HubSpotEvent): Promise<void> {
  const { subscriptionType, objectId, propertyName, propertyValue } = event
  const contactId = objectId.toString()

  if (subscriptionType === 'contact.propertyChange') {
    if (propertyName === 'customer_type' && propertyValue === 'Tenant') {
      await autoEnrollTenant(contactId)
      return
    }

    if (propertyName === 'token_payment_status' && propertyValue === 'Paid') {
      await handleTokenPaid(contactId)
      return
    }

    if (
      (propertyName === 'first_month_rent' || propertyName === 'tenant_security_deposit') &&
      propertyValue === 'Paid'
    ) {
      await checkPaymentSettled(contactId)
      return
    }
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text()
  const signature = request.headers.get('x-hubspot-signature-v3')
  const ts = request.headers.get('x-hubspot-request-timestamp')

  if (!verifyHubspotSignature(raw, 'POST', request.url, signature, ts)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let events: HubSpotEvent[]
  try {
    events = JSON.parse(raw)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const results = await Promise.allSettled(events.map(handleEvent))

  const failed = results.filter((r) => r.status === 'rejected').length
  if (failed > 0) {
    console.error(`[HubSpotWebhook] ${failed}/${events.length} events failed`)
  }

  return new Response('OK', { status: 200 })
}
