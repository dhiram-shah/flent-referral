/**
 * Superchat WhatsApp API integration.
 * Template names are stored in CommTemplate (editable via admin Comms dashboard).
 */

import { getTemplate } from './comms'

const SUPERCHAT_BASE = 'https://api.superchat.de/v1'

async function sendWhatsAppMessage(
  phone: string,
  templateName: string,
  variables: Record<string, string>
): Promise<void> {
  const apiKey = process.env.SUPERCHAT_API_KEY
  const workspaceId = process.env.SUPERCHAT_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    console.warn('[Superchat] Missing API credentials — WhatsApp message skipped')
    return
  }

  const normalizedPhone = normalizePhone(phone)

  try {
    const res = await fetch(`${SUPERCHAT_BASE}/workspaces/${workspaceId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        channel: 'whatsapp',
        to: normalizedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: Object.entries(variables).map(([, value]) => ({
                type: 'text',
                text: value,
              })),
            },
          ],
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[Superchat] Failed to send WhatsApp (${res.status}):`, err)
    }
  } catch (err) {
    console.error('[Superchat] Network error:', err)
  }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}

async function getTemplateName(key: string, fallback: string): Promise<string> {
  const tpl = await getTemplate(key).catch(() => null)
  return tpl?.body ?? fallback
}

export async function sendWelcomeWhatsApp(
  phone: string,
  name: string,
  referralCode: string,
  dashboardUrl: string
): Promise<void> {
  const template = await getTemplateName('wa_template_welcome', 'flent_referral_welcome')
  await sendWhatsAppMessage(phone, template, {
    '1': name.split(' ')[0],
    '2': referralCode,
    '3': dashboardUrl,
  })
}

export async function sendReferralInterestedWhatsApp(
  phone: string,
  referrerName: string,
  refereeName: string
): Promise<void> {
  const template = await getTemplateName('wa_template_interested', 'flent_referral_interested')
  await sendWhatsAppMessage(phone, template, {
    '1': referrerName.split(' ')[0],
    '2': refereeName,
  })
}

export async function sendReferralSignedWhatsApp(
  phone: string,
  referrerName: string,
  refereeName: string
): Promise<void> {
  const template = await getTemplateName('wa_template_signed', 'flent_referral_signed')
  await sendWhatsAppMessage(phone, template, {
    '1': referrerName.split(' ')[0],
    '2': refereeName,
  })
}

export async function sendMilestoneUnlockedWhatsApp(
  phone: string,
  referrerName: string,
  rewardName: string,
  dashboardUrl: string
): Promise<void> {
  const template = await getTemplateName('wa_template_completed', 'flent_milestone_unlocked')
  await sendWhatsAppMessage(phone, template, {
    '1': referrerName.split(' ')[0],
    '2': rewardName,
    '3': dashboardUrl,
  })
}

export async function sendOtpWhatsApp(phone: string, otp: string): Promise<void> {
  const template = await getTemplateName(
    'wa_template_otp',
    process.env.SUPERCHAT_TEMPLATE_OTP ?? 'referral_otp_verification'
  )
  await sendWhatsAppMessage(phone, template, { '1': otp })
}

/**
 * Send OTP via Meta Cloud API directly (bypasses Superchat).
 * Required for authentication-category templates which BSPs don't support.
 * Needs WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID env vars.
 */
export async function sendOtpMetaDirect(phone: string, otp: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    throw new Error('[Meta WA] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID')
  }

  const normalizedPhone = normalizePhone(phone)
  const templateName = process.env.SUPERCHAT_TEMPLATE_OTP ?? 'referral_otp_verification'

  const res = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    }),
  })

  const body = await res.text()
  console.log(`[Meta WA] status=${res.status} phone=${normalizedPhone} response=${body}`)

  if (!res.ok) {
    throw new Error(`[Meta WA] API error (${res.status}): ${body}`)
  }
}

export async function sendRedemptionFulfilledWhatsApp(
  phone: string,
  referrerName: string,
  rewardName: string
): Promise<void> {
  const template = await getTemplateName('wa_template_redeemed', 'flent_reward_fulfilled')
  await sendWhatsAppMessage(phone, template, {
    '1': referrerName.split(' ')[0],
    '2': rewardName,
  })
}
