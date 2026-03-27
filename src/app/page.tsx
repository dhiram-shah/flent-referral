import Link from 'next/link'
import { prisma } from '@/lib/prisma'

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

export default async function LandingPage() {
  const milestones = await getMilestones()

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          background: 'rgba(253,250,246,0.92)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://flent.in" className="flex items-center gap-2">
            <img src="/logo.png" alt="flent" style={{ height: 22, display: 'block' }} />
            <span
              style={{
                background: 'var(--brand-light)',
                color: 'var(--brand)',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 10px',
                borderRadius: 999,
                textTransform: 'uppercase' as const,
                letterSpacing: 1,
              }}
            >
              Referral Program
            </span>
          </a>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-pill-outline" style={{ padding: '8px 20px', fontSize: 13 }}>
              Sign in
            </Link>
            <Link href="/signup" className="btn-pill" style={{ padding: '9px 22px', fontSize: 13 }}>
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--brand-light)',
            color: 'var(--brand)',
            padding: '6px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          🎮 It&apos;s a game. Every referral levels you up.
        </div>
        <h1
          className="serif"
          style={{
            fontSize: 'clamp(38px, 6vw, 66px)',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--text)',
            marginBottom: 8,
          }}
        >
          Turn your network
        </h1>
        <h1
          className="serif-italic"
          style={{
            fontSize: 'clamp(38px, 6vw, 66px)',
            fontWeight: 700,
            lineHeight: 1.1,
            color: 'var(--brand)',
            marginBottom: 24,
          }}
        >
          into real rewards.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'var(--muted)',
            maxWidth: 540,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          Refer a friend to Flent. When they move in and complete a month, you unlock a reward.
          Keep going — milestones stack and so do the prizes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="btn-pill" style={{ fontSize: 16, padding: '15px 40px' }}>
            Get my referral code →
          </Link>
          <Link
            href="/login"
            style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
          >
            Already have a code? Sign in
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
        className="py-16"
      >
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="serif text-center"
            style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}
          >
            How it works
          </h2>
          <p className="text-center" style={{ color: 'var(--muted)', marginBottom: 48, fontSize: 16 }}>
            Three simple steps. Infinite rewards.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: '✍️',
                title: 'Sign up',
                desc: 'Create your free referrer account in 60 seconds. You get a unique code instantly.',
              },
              {
                step: '02',
                icon: '📤',
                title: 'Share your code',
                desc: 'Send your code to friends looking for quality co-living in Bangalore. WhatsApp, DM, anywhere.',
              },
              {
                step: '03',
                icon: '🎁',
                title: 'Unlock rewards',
                desc: 'When your friend moves in and completes a month, you hit a milestone and claim your reward.',
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  background: 'var(--bg)',
                  borderRadius: 20,
                  padding: 28,
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: 'var(--brand-light)',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 16,
                  }}
                >
                  {item.icon}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--brand)',
                    textTransform: 'uppercase' as const,
                    letterSpacing: 2,
                    marginBottom: 8,
                  }}
                >
                  Step {item.step}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reward roadmap ───────────────────────────────────────────────── */}
      {milestones.length > 0 && (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2
              className="serif text-center"
              style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}
            >
              Your reward roadmap
            </h2>
            <p className="text-center" style={{ color: 'var(--muted)', marginBottom: 48, fontSize: 16 }}>
              Each milestone is a level-up. Redeem and start the next streak.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {milestones.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 20,
                    padding: 20,
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{REWARD_ICONS[i] ?? '🎁'}</div>
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
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.rewardName}</div>
                  {m.rewardDescription && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
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

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div
            style={{
              background: 'var(--brand)',
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 8l1.5 4.5L20 14l-4.5 1.5L14 20l-1.5-4.5L8 14l4.5-1.5z' fill='%23FFFFFF' fill-opacity='0.06'/%3E%3C/svg%3E\")",
              borderRadius: 24,
              padding: '52px 32px',
            }}
          >
            <h2
              className="serif"
              style={{ color: '#fff', fontSize: 34, fontWeight: 800, marginBottom: 12 }}
            >
              Ready to start earning?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, marginBottom: 32 }}>
              Join the Flent community and earn rewards for every successful referral.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#fff',
                  color: 'var(--brand)',
                  padding: '15px 36px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                Get my referral code — it&apos;s free
              </Link>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 14,
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
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          © {new Date().getFullYear()} Flent · Bangalore ·{' '}
          <a href="https://flent.in/terms" style={{ color: 'var(--brand)' }}>
            Terms
          </a>{' '}
          ·{' '}
          <a href="https://flent.in/privacy" style={{ color: 'var(--brand)' }}>
            Privacy
          </a>{' '}
          · Questions?{' '}
          <a href="mailto:sales@flent.in" style={{ color: 'var(--brand)' }}>
            sales@flent.in
          </a>
        </p>
      </footer>
    </main>
  )
}
