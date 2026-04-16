/**
 * Unified notification sender — fires email (and WhatsApp when phone available)
 * in parallel and logs results to the DB. Never throws — failures are logged.
 */

import { prisma } from './prisma'
import * as email from './resend'
import * as wa from './superchat'

type NotifEvent =
  | 'OTP_SENT'
  | 'WELCOME'
  | 'REFERRAL_INTERESTED'
  | 'REFERRAL_SIGNED'
  | 'REFERRAL_COMPLETED'
  | 'REDEMPTION_CONFIRMED'

interface Referrer {
  id: string
  name: string
  email: string
  phone?: string | null
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flent.in/referral-program'
const DASHBOARD_URL = `${APP_URL}/dashboard`

async function fire(
  referrerId: string,
  event: NotifEvent,
  emailFn: () => Promise<void>,
  waFn?: () => Promise<void>
): Promise<void> {
  const promises: Promise<PromiseSettledResult<void>>[] = [
    Promise.allSettled([emailFn()]).then((r) => r[0]),
  ]
  if (waFn) {
    promises.push(Promise.allSettled([waFn()]).then((r) => r[0]))
  }

  const [emailResult, waResult] = await Promise.all(promises)

  const logs = [
    {
      referrerId,
      channel: 'EMAIL',
      event,
      status: emailResult.status === 'fulfilled' ? 'SENT' : 'FAILED',
    },
  ]
  if (waResult) {
    logs.push({
      referrerId,
      channel: 'WHATSAPP',
      event,
      status: waResult.status === 'fulfilled' ? 'SENT' : 'FAILED',
    })
  }

  await prisma.notificationLog.createMany({ data: logs }).catch(console.error)

  if (emailResult.status === 'rejected') {
    console.error(`[Notify] Email ${event} failed:`, emailResult.reason)
  }
  if (waResult?.status === 'rejected') {
    console.error(`[Notify] WhatsApp ${event} failed:`, waResult.reason)
  }
}

export async function notifyOtp(params: {
  email: string
  name: string
  otp: string
  referrerId?: string
}): Promise<void> {
  const emailResult = await email
    .sendOtpEmail(params.email, params.name, params.otp)
    .then(() => 'SENT' as const)
    .catch((err) => {
      console.error('[Notify] OTP email failed:', err)
      return 'FAILED' as const
    })

  if (params.referrerId) {
    await prisma.notificationLog
      .createMany({
        data: [
          { referrerId: params.referrerId, channel: 'EMAIL', event: 'OTP_SENT', status: emailResult },
        ],
      })
      .catch(console.error)
  }
}

export async function notifyWelcome(referrer: Referrer, referralCode: string): Promise<void> {
  await fire(
    referrer.id,
    'WELCOME',
    () => email.sendWelcomeEmail(referrer.email, referrer.name, referralCode, DASHBOARD_URL),
    referrer.phone
      ? () => wa.sendWelcomeWhatsApp(referrer.phone!, referrer.name, referralCode, DASHBOARD_URL)
      : undefined
  )
}

export async function notifyReferralInterested(
  referrer: Referrer,
  refereeName: string
): Promise<void> {
  await fire(
    referrer.id,
    'REFERRAL_INTERESTED',
    () => email.sendReferralStatusEmail(referrer.email, referrer.name, refereeName, 'interested'),
    referrer.phone
      ? () => wa.sendReferralInterestedWhatsApp(referrer.phone!, referrer.name, refereeName)
      : undefined
  )
}

export async function notifyReferralSigned(
  referrer: Referrer,
  refereeName: string
): Promise<void> {
  await fire(
    referrer.id,
    'REFERRAL_SIGNED',
    () => email.sendReferralStatusEmail(referrer.email, referrer.name, refereeName, 'signed'),
    referrer.phone
      ? () => wa.sendReferralSignedWhatsApp(referrer.phone!, referrer.name, refereeName)
      : undefined
  )
}

export async function notifyReferralCompleted(
  referrer: Referrer,
  refereeName: string,
  rewardName?: string
): Promise<void> {
  await fire(
    referrer.id,
    'REFERRAL_COMPLETED',
    () =>
      email.sendReferralStatusEmail(
        referrer.email,
        referrer.name,
        refereeName,
        'completed',
        rewardName
      ),
    referrer.phone
      ? () =>
          wa.sendMilestoneUnlockedWhatsApp(
            referrer.phone!,
            referrer.name,
            rewardName ?? 'your next reward',
            DASHBOARD_URL
          )
      : undefined
  )
}

export async function notifyRedemptionConfirmed(
  referrer: Referrer,
  rewardName: string
): Promise<void> {
  await fire(
    referrer.id,
    'REDEMPTION_CONFIRMED',
    () => email.sendRedemptionConfirmedEmail(referrer.email, referrer.name, rewardName),
    referrer.phone
      ? () => wa.sendRedemptionFulfilledWhatsApp(referrer.phone!, referrer.name, rewardName)
      : undefined
  )
}
