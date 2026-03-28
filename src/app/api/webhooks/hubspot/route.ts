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

async function mapSettledWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<PromiseSettledResult<void>[]> {
  const limit = Math.max(1, Math.floor(concurrency))
  const results: PromiseSettledResult<void>[] = new Array(items.length)
  let cursor = 0

  const run = async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      try {
        await worker(items[i], i)
        results[i] = { status: 'fulfilled', value: undefined }
      } catch (reason) {
        results[i] = { status: 'rejected', reason }
      }
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run())
  await Promise.all(runners)
  return results
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

  if (!verifyHubspotSignature(raw, 'POST', request.url, signature, ts)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let events: HubSpotEvent[]
  try {
    events = JSON.parse(raw)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const maxConcurrency = Number(process.env.HUBSPOT_WEBHOOK_MAX_CONCURRENCY ?? '8') || 8

  // Process events with bounded concurrency (burst-safe)
  const results = await mapSettledWithConcurrency(events, maxConcurrency, handleEvent)

  const failed = results.filter((r) => r.status === 'rejected').length
  if (failed > 0) {
    console.error(`[HubSpotWebhook] ${failed}/${events.length} events failed`)
  }

  return new Response('OK', { status: 200 })
}

async function handleEvent(event: HubSpotEvent, index?: number): Promise<void> {
  const idx = typeof index === 'number' ? index : -1
  const { subscriptionType, objectId, propertyName, propertyValue } = event

  // ── Tenant created: auto-enroll as referrer ──────────────────────────────
  if (
    subscriptionType === 'contact.creation' ||
    (subscriptionType === 'contact.propertyChange' && propertyName === 'lifecyclestage' && propertyValue === 'customer')
  ) {
    try {
      await autoEnrollTenant(objectId.toString())
    } catch (err) {
      console.error('[HubSpotWebhook] autoEnrollTenant failed', { idx, objectId, err })
      throw err
    }
    return
  }

  // ── Deal stage changes ───────────────────────────────────────────────────
  if (subscriptionType === 'deal.propertyChange' && propertyName === 'dealstage') {
    const STAGE_AGREEMENT_SIGNED = process.env.HUBSPOT_STAGE_AGREEMENT_SIGNED ?? 'agreement_signed'
    const STAGE_COMPLETED = process.env.HUBSPOT_STAGE_COMPLETED ?? 'tenancy_completed'

    if (propertyValue === STAGE_AGREEMENT_SIGNED) {
      try {
        await handleAgreementSigned(objectId.toString())
      } catch (err) {
        console.error('[HubSpotWebhook] handleAgreementSigned failed', { idx, objectId, err })
        throw err
      }
    } else if (propertyValue === STAGE_COMPLETED) {
      try {
        await handleTenancyCompleted(objectId.toString())
      } catch (err) {
        console.error('[HubSpotWebhook] handleTenancyCompleted failed', { idx, objectId, err })
        throw err
      }
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
  const referral = await prisma.referral.findUnique({
    where: { hubspotId: hubspotDealId },
    select: {
      id: true,
      status: true,
      isDisqualified: true,
      refereeName: true,
      referrer: { select: { id: true, name: true, email: true, phone: true } },
    },
  })
  if (!referral || referral.status !== 'INTERESTED') return
  if (referral.isDisqualified) return

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: 'AGREEMENT_SIGNED', signedAt: new Date() },
  })

  notifyReferralSigned(referral.referrer, referral.refereeName).catch(console.error)
}

async function handleTenancyCompleted(hubspotDealId: string): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { hubspotId: hubspotDealId },
    select: {
      id: true,
      status: true,
      isDisqualified: true,
      completedAt: true,
      refereeName: true,
      referrerId: true,
      referrer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          progress: { select: { currentStreakCount: true, lifetimeCompletedCount: true } },
        },
      },
    },
  })
  if (!referral || referral.status === 'COMPLETED') return
  if (referral.isDisqualified) return

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
    const controller = new AbortController()
    const timeoutMs = Number(process.env.HUBSPOT_CONTACT_FETCH_TIMEOUT_MS ?? '6000') || 6000
    const t = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone`,
      { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
    )
    clearTimeout(t)
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
