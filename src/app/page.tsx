import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { HowItWorks } from '@/components/ui/HowItWorks'
import { FaqAccordion } from '@/components/ui/FaqAccordion'

async function getMilestones() {
  try {
    return await prisma.milestoneConfig.findMany({
      where: { isActive: true },
      orderBy: { tierNumber: 'asc' },
      select: { id: true, tierNumber: true, referralsRequired: true, rewardName: true, rewardDescription: true },
    })
  } catch {
    return []
  }
}

const REWARD_ICONS = ['🎁', '🛍️', '🎧', '✈️', '🏆']
const WIN_ITEMS = [
  { title: 'Vouchers', Icon: GiftOutlineIcon, sub: 'Everyday wins' },
  { title: 'Flight tickets', Icon: PlaneOutlineIcon, sub: 'Weekend getaways' },
  { title: 'AirPods', Icon: EarbudsOutlineIcon, sub: 'Daily essentials' },
  { title: 'iPhone', Icon: PhoneOutlineIcon, sub: 'Big milestone' },
  { title: 'Ray-Ban Meta', Icon: GlassesOutlineIcon, sub: 'Premium tech' },
  { title: 'Marshall speakers', Icon: SpeakerOutlineIcon, sub: 'For the house party' },
  { title: 'Mokobara bags', Icon: BagOutlineIcon, sub: 'Travel-ready' },
]

export default async function LandingPage() {
  const milestones = await getMilestones()

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(252,251,247,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: '0 32px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo in bordered oval — matches flent.in */}
          <a href="https://flent.in" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <div
              style={{
                border: '1.5px solid var(--brand)',
                borderRadius: 999,
                padding: '7px 18px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <img src="/logo.png" alt="flent" style={{ height: 22, display: 'block' }} />
            </div>
          </a>
          {/* Right: plain sign-in + bordered Join pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link
              href="/login"
              style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, textDecoration: 'none', opacity: 0.75 }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                border: '1.5px solid var(--brand)',
                borderRadius: 999,
                padding: '9px 22px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Join — it&apos;s free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Geometric pattern — 50% opacity at top, fades to 0% at bottom */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/patterns/pie-factory.svg')",
            backgroundSize: '60px 60px',
            backgroundRepeat: 'repeat',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
          }}
        />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1000,
          margin: '0 auto',
          padding: 'clamp(72px, 10vw, 110px) 20px clamp(64px, 8vw, 88px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--brand-light)',
            color: 'var(--brand)',
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 32,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#10B981',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          Open to everyone — tenants and non-tenants
        </div>

        <h1
          className="serif"
          style={{
            fontSize: 'clamp(54px, 8vw, 90px)',
            fontWeight: 800,
            lineHeight: 1.06,
            color: 'var(--text)',
            marginBottom: 4,
          }}
        >
          Refer friends to Flent.
        </h1>
        <h1
          className="serif-italic"
          style={{
            fontSize: 'clamp(54px, 8vw, 90px)',
            fontWeight: 700,
            lineHeight: 1.06,
            color: 'var(--brand)',
            marginBottom: 28,
          }}
        >
          Earn real rewards.
        </h1>

        <p
          style={{
            fontSize: 17,
            color: 'var(--muted)',
            maxWidth: 460,
            margin: '0 auto 44px',
            lineHeight: 1.7,
          }}
        >
          Share your code. Friend moves in. You earn — and every milestone gets better.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <Link href="/signup" className="btn-pastel-violet" style={{ fontSize: 16, padding: '16px 48px' }}>
            Get my referral code →
          </Link>
          <Link href="/login" style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Already a member?{' '}
            <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Track your progress →</span>
          </Link>
        </div>
      </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="trust-strip-grid"
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '0 20px',
          }}
        >
          {[
            { Icon: BoltOutlineIcon, label: 'Sign up in 60 seconds', sub: 'Instant referral code' },
            { Icon: InfinityOutlineIcon, label: 'No cap on earnings', sub: 'Every referral counts' },
            { Icon: HomeOutlineIcon, label: 'Homes friends will love', sub: 'Premium, move-in ready' },
            { Icon: SupportOutlineIcon, label: 'Real human support', sub: 'sales@flent.in' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '28px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  marginBottom: 12,
                  color: 'var(--brand)',
                  lineHeight: 1,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <item.Icon />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you can earn / win ───────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--brand)',
                textTransform: 'uppercase' as const,
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              What you can win
            </div>
            <h2 className="serif" style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
              Rewards worth sharing
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Unlock milestones and redeem premium rewards — from everyday vouchers to big-ticket wins.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              padding: '6px 2px 14px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
            aria-label="Rewards carousel"
          >
            {WIN_ITEMS.map((item) => (
              <div
                key={item.title}
                style={{
                  scrollSnapAlign: 'start',
                  minWidth: 240,
                  maxWidth: 260,
                  flex: '0 0 auto',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 22,
                  padding: '22px 18px',
                  boxShadow: '0 10px 30px rgba(24,41,61,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F6F2 100%)',
                    }}
                  >
                    <item.Icon />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.sub}</div>
                  </div>
                </div>
                <div
                  style={{
                    height: 1,
                    background: 'var(--border)',
                    margin: '14px 0',
                  }}
                />
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                  Redeem when you hit the next tier.
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
            Scroll to explore the possibilities.
          </div>
        </div>
      </section>

      {/* ── How it works — scroll timeline (client component) ────────────── */}
      <HowItWorks />

      {/* ── Reward roadmap ───────────────────────────────────────────────── */}
      {milestones.length > 0 && (
        <section style={{ padding: '96px 32px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--brand)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: 3,
                  marginBottom: 16,
                }}
              >
                Rewards
              </div>
              <h2
                className="serif"
                style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}
              >
                Every milestone, a better reward
              </h2>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 16,
                  maxWidth: 480,
                  margin: '0 auto',
                  lineHeight: 1.7,
                }}
              >
                Rewards unlock as you build your streak. Redeem one and start the next level.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
              }}
            >
              {milestones.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 20,
                    padding: '28px 16px',
                    border: '2px solid var(--brand)',
                    boxShadow: '4px 4px 0 var(--brand)',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 30, marginBottom: 12 }}>{REWARD_ICONS[i] ?? '🎁'}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--brand)',
                      textTransform: 'uppercase' as const,
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    {m.referralsRequired} {m.referralsRequired === 1 ? 'referral' : 'referrals'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                    {m.rewardName}
                  </div>
                  {m.rewardDescription && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                      {m.rewardDescription}
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'var(--brand-light)',
                      color: 'var(--brand)',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                    }}
                  >
                    Tier {m.tierNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Why your friends will love Flent ─────────────────────────────── */}
      <section
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '96px 32px',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--brand)',
                textTransform: 'uppercase' as const,
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              Why refer
            </div>
            <h2
              className="serif"
              style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}
            >
              Your friends will actually thank you
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 16,
                maxWidth: 500,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Flent homes are different. Here&apos;s why your referral isn&apos;t just good for you — it&apos;s genuinely great for them.
            </p>
          </div>

          <div className="friends-grid">
            {[
              {
                color: '#cff0e9',
                icon: '💸',
                title: 'No brokerage. We pay you instead.',
                desc: "Flent cuts out brokers entirely. There's no middleman eating into your pocket — and instead of paying a broker, we reward you for the referral. Transparent pricing, no hidden charges.",
              },
              {
                color: '#ffe2d8',
                icon: '🔑',
                title: 'No hefty deposits. Move in light.',
                desc: "Standard rentals demand 2–3 months upfront. Flent keeps it minimal so your friend can hold onto their money for things that actually matter — like furnishing their social life.",
              },
              {
                color: '#dad7f4',
                icon: '🛋️',
                title: '200+ items. Ready from day 0.',
                desc: "Fully furnished homes with everything — kitchen essentials, appliances, linen, furniture. Your friend arrives, drops their bag, and gets on with their life. Zero setup stress.",
              },
              {
                color: '#f5d9a8',
                icon: '🎉',
                title: 'More time for you to party.',
                desc: "No repair drama, no chasing landlords, no random broker calls. Flent handles it all. Your friend gets their weekends back — and honestly, so do you. Who's bringing the wine?",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: item.color,
                  borderRadius: 16,
                  padding: '24px 20px',
                  border: '2px solid #15102E',
                  boxShadow: '4px 4px 0 #15102E',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 12, lineHeight: 1 }}>
                  {item.icon}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#15102E', marginBottom: 8, lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ color: 'rgba(21,16,46,0.68)', fontSize: 13, lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--brand)',
                textTransform: 'uppercase' as const,
                letterSpacing: 3,
                marginBottom: 16,
              }}
            >
              By the numbers
            </div>
            <h2
              className="serif"
              style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: 'var(--text)' }}
            >
              A community that&apos;s already growing fast
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
            }}
          >
            {[
              {
                color: '#c64747',
                textColor: '#fff',
                stat: '₹1Cr+',
                label: 'Invested by landlords & tenants in our last funding round',
              },
              {
                color: '#008e75',
                textColor: '#fff',
                stat: '450+',
                label: 'Happy tenants living in Flent homes across Bangalore',
              },
              {
                color: '#7f5639',
                textColor: '#fff',
                stat: '200+',
                label: 'Items in every home — so your friend walks in ready to live',
              },
            ].map((item) => (
              <div
                key={item.stat}
                style={{
                  background: item.color,
                  borderRadius: 24,
                  padding: '44px 36px',
                  border: '2px solid #15102E',
                  boxShadow: '6px 6px 0 #15102E',
                }}
              >
                <div
                  className="serif"
                  style={{
                    fontSize: 'clamp(48px, 7vw, 72px)',
                    fontWeight: 800,
                    color: item.textColor,
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  {item.stat}
                </div>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 15,
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <FaqAccordion />

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section style={{ padding: '0 32px 96px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div
            style={{
              background: 'var(--brand)',
              borderRadius: 28,
              padding: '72px 48px',
              textAlign: 'center',
            }}
          >
            <h2
              className="serif"
              style={{
                color: '#fff',
                fontSize: 'clamp(26px, 4vw, 42px)',
                fontWeight: 800,
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              Your next reward is
              <br />
              one referral away.
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 16,
                maxWidth: 400,
                margin: '0 auto 40px',
                lineHeight: 1.75,
              }}
            >
              Create a free account and get your referral code in under a minute.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Link
                href="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#fff',
                  color: 'var(--brand)',
                  padding: '16px 44px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
              >
                Get my referral code — it&apos;s free
              </Link>
              <Link
                href="/login"
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Already a member? Sign in →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 48px' }}>
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap' as const,
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            © {new Date().getFullYear()} Flent. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 32 }}>
            <a
              href="https://flent.in/privacy"
              style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}
            >
              Privacy Policy
            </a>
            <a
              href="https://flent.in/terms"
              style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}
            >
              Terms of Service
            </a>
            <a
              href="mailto:sales@flent.in"
              style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>

    </main>
  )
}

function iconBaseProps() {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    'aria-hidden': true as const,
  }
}

function BoltOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M13 2L4 14H11L10 22L20 9H13L13 2Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function InfinityOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path
        d="M8.2 15.2C6.3 17.1 3.7 17.1 2 15.4C0.3 13.7 0.3 11.1 2.2 9.2C4.1 7.3 6.7 7.3 8.4 9L12 12.6L15.6 9C17.3 7.3 19.9 7.3 21.8 9.2C23.7 11.1 23.7 13.7 22 15.4C20.3 17.1 17.7 17.1 15.8 15.2L12 11.4L8.2 15.2Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HomeOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M4 10.5L12 4L20 10.5V20H4V10.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 20V14.5H14.5V20" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function SupportOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path
        d="M4.5 12C4.5 8.13401 7.63401 5 11.5 5H12.5C16.366 5 19.5 8.13401 19.5 12V15.5C19.5 16.6046 18.6046 17.5 17.5 17.5H16.5V12.5H19.5"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M4.5 12H7.5V17.5H6.5C5.39543 17.5 4.5 16.6046 4.5 15.5V12Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 17.5C16.5 19.1569 15.1569 20.5 13.5 20.5H11.5"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GiftOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M4 10H20V20H4V10Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10V20" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 10V7.5C4 6.67157 4.67157 6 5.5 6H18.5C19.3284 6 20 6.67157 20 7.5V10" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path
        d="M12 6C12 4.89543 12.8954 4 14 4C15.6569 4 17 5.34315 17 7H12V6Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 6C12 4.89543 11.1046 4 10 4C8.34315 4 7 5.34315 7 7H12V6Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlaneOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path
        d="M10.5 13.5L21 9.5L10.5 5.5V9L4 7.5V11.5L10.5 10.1V13.5Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M10.5 13.5L8.5 20L11 18.8L13 22L15 21L13 17.5" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function EarbudsOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M7 12V10C7 8.34315 8.34315 7 10 7" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 12V10C17 8.34315 15.6569 7 14 7" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 12.5C6 11.6716 6.67157 11 7.5 11H8C8.82843 11 9.5 11.6716 9.5 12.5V15C9.5 15.8284 8.82843 16.5 8 16.5H7.5C6.67157 16.5 6 15.8284 6 15V12.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.5 12.5C14.5 11.6716 15.1716 11 16 11H16.5C17.3284 11 18 11.6716 18 12.5V15C18 15.8284 17.3284 16.5 16.5 16.5H16C15.1716 16.5 14.5 15.8284 14.5 15V12.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M8 3.5H16C17.1046 3.5 18 4.39543 18 5.5V18.5C18 19.6046 17.1046 20.5 16 20.5H8C6.89543 20.5 6 19.6046 6 18.5V5.5C6 4.39543 6.89543 3.5 8 3.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 6.5H14" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 18H12.01" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function GlassesOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M6.5 14.5C4.84315 14.5 3.5 13.1569 3.5 11.5C3.5 9.84315 4.84315 8.5 6.5 8.5C8.15685 8.5 9.5 9.84315 9.5 11.5C9.5 13.1569 8.15685 14.5 6.5 14.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17.5 14.5C15.8431 14.5 14.5 13.1569 14.5 11.5C14.5 9.84315 15.8431 8.5 17.5 8.5C19.1569 8.5 20.5 9.84315 20.5 11.5C20.5 13.1569 19.1569 14.5 17.5 14.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 11.5H14.5" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.5 11.5L2.5 10.5" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20.5 11.5L21.5 10.5" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SpeakerOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M7.5 4.5H16.5C17.6046 4.5 18.5 5.39543 18.5 6.5V17.5C18.5 18.6046 17.6046 19.5 16.5 19.5H7.5C6.39543 19.5 5.5 18.6046 5.5 17.5V6.5C5.5 5.39543 6.39543 4.5 7.5 4.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10.25C13.2426 10.25 14.25 11.2574 14.25 12.5C14.25 13.7426 13.2426 14.75 12 14.75C10.7574 14.75 9.75 13.7426 9.75 12.5C9.75 11.2574 10.7574 10.25 12 10.25Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 6.8H12.01" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function BagOutlineIcon() {
  return (
    <svg {...iconBaseProps()}>
      <path d="M6 8.5H18L19 20H5L6 8.5Z" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 8.5V7.5C9 5.84315 10.3431 4.5 12 4.5C13.6569 4.5 15 5.84315 15 7.5V8.5" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
