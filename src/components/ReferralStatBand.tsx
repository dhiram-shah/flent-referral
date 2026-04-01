import { getTemplate } from '@/lib/comms'

export default async function ReferralStatBand() {
  const tpl = await getTemplate('ui_community_stat')
  const stat = tpl?.body ?? '500+'

  return (
    <section style={{
      borderTop: '1.5px solid var(--brand)',
      borderBottom: '1.5px solid var(--brand)',
      background: 'var(--surface)',
      padding: 'clamp(28px, 4vw, 48px) 24px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 10,
      }}>
        By the numbers
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span
          className="serif"
          style={{
            fontSize: 'clamp(52px, 8vw, 80px)',
            fontWeight: 700,
            color: 'var(--brand)',
            lineHeight: 1,
          }}
        >
          {stat}
        </span>
        <span style={{
          fontSize: 'clamp(16px, 2.5vw, 22px)',
          color: 'var(--muted)',
          fontWeight: 500,
          letterSpacing: 0.5,
        }}>
          referrals made by our community
        </span>
      </div>
    </section>
  )
}
