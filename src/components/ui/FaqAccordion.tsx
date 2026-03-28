'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'Who can refer? Do I need to be a Flent tenant?',
    a: "Not at all — anyone can join. You don't need to be living at a Flent property. If you know someone looking for quality housing in Bangalore, your code works for them.",
  },
  {
    q: 'When exactly do I earn a reward?',
    a: 'You earn when your referred friend (1) signs a rental agreement with Flent, and (2) completes their first month. Both conditions must be met. This typically takes 6–10 weeks from enquiry.',
  },
  {
    q: 'How will I receive my reward?',
    a: 'Our team reaches out within 7 days of your milestone unlock to coordinate the reward. Delivery format depends on the prize — voucher, bank transfer, or physical item.',
  },
  {
    q: 'Can I refer more than one person?',
    a: 'Yes — every successful referral counts toward your streak. Rewards improve at each milestone tier. The more you refer, the better it gets — there is no cap.',
  },
  {
    q: "What if my friend entered someone else's code?",
    a: 'The first code entered on the Flent enquiry form is the one that counts. We cannot change this after the fact — so make sure your friend has your code before they fill out any enquiry form.',
  },
  {
    q: 'Do referral codes expire?',
    a: "Never. Your code is permanent and always active. There's no deadline — refer someone today or six months from now, it works the same.",
  },
]

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--brand)',
              textTransform: 'uppercase',
              letterSpacing: 3,
              marginBottom: 16,
            }}
          >
            FAQ
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 800,
              color: 'var(--text)',
            }}
          >
            Questions, answered
          </h2>
        </div>

        {/* Accordion */}
        <div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '22px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 20,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}>
                  {faq.q}
                </span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 18,
                    fontWeight: 300,
                    color: 'var(--brand)',
                    transition: 'transform 0.2s ease',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  maxHeight: open === i ? 240 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.32s ease',
                }}
              >
                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: 15,
                    lineHeight: 1.8,
                    paddingBottom: 24,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 44, fontSize: 14, color: 'var(--muted)' }}>
          Still have questions?{' '}
          <a href="mailto:sales@flent.in" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
            Email us at sales@flent.in
          </a>
        </p>
      </div>
    </section>
  )
}
