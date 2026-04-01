/**
 * Comms template store — reads editable templates from DB.
 * On first access, auto-seeds defaults so emails work before
 * a marketing user has visited the Comms dashboard.
 */

import { prisma } from './prisma'

export interface CommTemplate {
  key: string
  label: string
  channel: string
  subject?: string | null
  body: string
  variables: string[]
  updatedAt: Date
  updatedBy?: string | null
}

/** Replace {{variable}} placeholders with values */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

const DASHBOARD_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://flent.in/referral-program'}/dashboard`

export const DEFAULT_TEMPLATES: Record<string, Omit<CommTemplate, 'key' | 'updatedAt' | 'updatedBy'>> = {
  email_otp: {
    label: 'Sign-in OTP',
    channel: 'EMAIL',
    subject: '{{otp}} is your Flent verification code',
    body: `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #7C3AED; margin-bottom: 8px;">Hi {{name}},</h2>
  <p style="color: #374151; font-size: 16px;">Use the code below to verify your email and join the Flent Referral Program.</p>
  <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
    <p style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #111827; margin: 0;">{{otp}}</p>
  </div>
  <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. Never share it with anyone.</p>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
</div>`,
    variables: ['name', 'otp'],
  },
  email_welcome: {
    label: 'Welcome Email',
    channel: 'EMAIL',
    subject: 'Welcome to the Flent Referral Program, {{firstName}}!',
    body: `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
  <h1 style="color: #7C3AED;">You're in! 🎉</h1>
  <p style="color: #374151; font-size: 16px;">Hey {{firstName}}, your referral account is live. Every friend you refer to Flent brings you closer to amazing rewards.</p>
  <div style="background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); border-radius: 16px; padding: 28px; text-align: center; margin: 24px 0;">
    <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">Your Referral Code</p>
    <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #FFFFFF; margin: 0;">{{referralCode}}</p>
  </div>
  <p style="color: #374151; font-size: 15px;">Share this code with friends looking for quality co-living in Bangalore. When they move in and complete a month, you unlock rewards — and they keep stacking.</p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View My Dashboard →</a>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
</div>`,
    variables: ['firstName', 'referralCode', 'dashboardUrl'],
  },
  email_referral_interested: {
    label: 'Referral — Interested',
    channel: 'EMAIL',
    subject: '{{refereeName}} just showed interest in Flent!',
    body: `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #7C3AED;">Referral Update</h2>
  <p style="color: #374151; font-size: 16px;">Hey {{firstName}}, your referral is moving! <strong>{{refereeName}}</strong> just submitted an enquiry on Flent using your code. We'll keep you posted.</p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Dashboard →</a>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
</div>`,
    variables: ['firstName', 'refereeName', 'dashboardUrl'],
  },
  email_referral_signed: {
    label: 'Referral — Agreement Signed',
    channel: 'EMAIL',
    subject: "{{refereeName}} signed their agreement — you're almost there!",
    body: `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #7C3AED;">Referral Update</h2>
  <p style="color: #374151; font-size: 16px;">Big news! <strong>{{refereeName}}</strong> has signed their tenancy agreement at Flent. Once they complete their first month, your referral will be fully credited.</p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Dashboard →</a>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
</div>`,
    variables: ['firstName', 'refereeName', 'dashboardUrl'],
  },
  email_referral_completed: {
    label: 'Referral — Completed',
    channel: 'EMAIL',
    subject: "Referral complete — you've unlocked a reward! 🎁",
    body: `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #7C3AED;">Referral Update</h2>
  <p style="color: #374151; font-size: 16px;"><strong>{{refereeName}}</strong> has completed their first month at Flent. Your referral is now fully credited — {{rewardLine}}</p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Dashboard →</a>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
</div>`,
    variables: ['firstName', 'refereeName', 'rewardLine', 'dashboardUrl'],
  },
  email_redemption_confirmed: {
    label: 'Redemption Confirmed',
    channel: 'EMAIL',
    subject: 'Your reward is on its way! 🚀',
    body: `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
  <h1 style="color: #7C3AED;">Your reward is coming!</h1>
  <p style="color: #374151; font-size: 16px;">Hey {{firstName}}, we've processed your redemption for <strong>{{rewardName}}</strong>. You'll receive it within 7 business days.</p>
  <p style="color: #374151; font-size: 16px;">Your referral counter has been reset — time to start the next streak! 🎮</p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0;">Start Round 2 →</a>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="color: #9CA3AF; font-size: 12px;">Flent · Bangalore · <a href="https://flent.in" style="color: #7C3AED;">flent.in</a></p>
</div>`,
    variables: ['firstName', 'rewardName', 'dashboardUrl'],
  },
  wa_template_welcome: {
    label: 'WA: Welcome',
    channel: 'WHATSAPP',
    body: process.env.SUPERCHAT_TEMPLATE_WELCOME ?? 'flent_referral_welcome',
    variables: ['var1=firstName', 'var2=referralCode', 'var3=dashboardUrl'],
  },
  wa_template_interested: {
    label: 'WA: Referral Interested',
    channel: 'WHATSAPP',
    body: process.env.SUPERCHAT_TEMPLATE_INTERESTED ?? 'flent_referral_interested',
    variables: ['var1=referrerFirstName', 'var2=refereeName'],
  },
  wa_template_signed: {
    label: 'WA: Agreement Signed',
    channel: 'WHATSAPP',
    body: process.env.SUPERCHAT_TEMPLATE_SIGNED ?? 'flent_referral_signed',
    variables: ['var1=referrerFirstName', 'var2=refereeName'],
  },
  wa_template_completed: {
    label: 'WA: Milestone Unlocked',
    channel: 'WHATSAPP',
    body: process.env.SUPERCHAT_TEMPLATE_COMPLETED ?? 'flent_milestone_unlocked',
    variables: ['var1=referrerFirstName', 'var2=rewardName', 'var3=dashboardUrl'],
  },
  wa_template_redeemed: {
    label: 'WA: Reward Fulfilled',
    channel: 'WHATSAPP',
    body: process.env.SUPERCHAT_TEMPLATE_REDEEMED ?? 'flent_reward_fulfilled',
    variables: ['var1=referrerFirstName', 'var2=rewardName'],
  },
  ui_wa_share_text: {
    label: 'WhatsApp Share Sheet',
    channel: 'UI',
    body: `Hey! I've already referred {{lifetimeCount}} friends to Flent and they're really happy living there! 🏠\n\nCheck out their co-living spaces in Bangalore and use my code *{{referralCode}}* when you enquire.\n\nhttps://flent.in{{tierBrag}}`,
    variables: ['referralCode', 'lifetimeCount', 'tierBrag'],
  },
  ui_instagram_share_text: {
    label: 'Instagram Share Caption',
    channel: 'UI',
    body: `Living in Bangalore or moving here? I've already referred {{lifetimeCount}} friends to @flentliving and they absolutely love it 🏠\n\nUse my referral code {{referralCode}} when you enquire at flent.in{{tierBrag}}`,
    variables: ['referralCode', 'lifetimeCount', 'tierBrag'],
  },
  ui_community_stat: {
    label: 'Community Stat (Home Page)',
    channel: 'UI',
    body: '500+',
    variables: [],
  },
}

/** Fetch a template from DB, auto-seeding the default if it doesn't exist yet */
export async function getTemplate(key: string): Promise<CommTemplate | null> {
  const existing = await prisma.commTemplate.findUnique({ where: { key } })
  if (existing) {
    return { ...existing, variables: existing.variables as string[] }
  }

  const def = DEFAULT_TEMPLATES[key]
  if (!def) return null

  const created = await prisma.commTemplate.create({
    data: { key, label: def.label, channel: def.channel, subject: def.subject, body: def.body, variables: def.variables },
  })
  return { ...created, variables: created.variables as string[] }
}

/** Fetch all templates, seeding any missing defaults */
export async function getAllTemplates(): Promise<CommTemplate[]> {
  const existing = await prisma.commTemplate.findMany({ orderBy: { key: 'asc' } })
  const existingKeys = new Set(existing.map((t) => t.key))

  const toSeed = Object.entries(DEFAULT_TEMPLATES).filter(([key]) => !existingKeys.has(key))

  if (toSeed.length > 0) {
    await prisma.commTemplate.createMany({
      data: toSeed.map(([key, def]) => ({
        key,
        label: def.label,
        channel: def.channel,
        subject: def.subject ?? null,
        body: def.body,
        variables: def.variables,
      })),
      skipDuplicates: true,
    })
    const refreshed = await prisma.commTemplate.findMany({ orderBy: { key: 'asc' } })
    return refreshed.map((t) => ({ ...t, variables: t.variables as string[] }))
  }

  return existing.map((t) => ({ ...t, variables: t.variables as string[] }))
}

export { DASHBOARD_URL }
