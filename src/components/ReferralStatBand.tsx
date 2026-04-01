import { getTemplate } from '@/lib/comms'
import ReferralStatCounter from './ReferralStatCounter'

export default async function ReferralStatBand() {
  const tpl = await getTemplate('ui_community_stat')
  const stat = tpl?.body?.trim() ?? '500+'

  return (
    <section
      style={{
        background: 'var(--bg)',
        borderTop: '1.5px solid var(--brand)',
        borderBottom: '1.5px solid var(--brand)',
        padding: 'clamp(48px, 7vw, 80px) 24px',
        textAlign: 'center',
      }}
    >
      <ReferralStatCounter stat={stat} />
      <p
        style={{
          marginTop: 12,
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--muted)',
          fontWeight: 500,
          letterSpacing: 0.3,
        }}
      >
        referrals made by our community
      </p>
      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          color: 'var(--muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 3,
          opacity: 0.6,
        }}
      >
        and counting
      </p>
    </section>
  )
}
