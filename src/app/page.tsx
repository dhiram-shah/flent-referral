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
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://flent.in" className="flex items-center gap-2">
            <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 22 }}>flent</span>
            <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Referral Program</span>
          </a>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" style={{ color: 'var(--muted)', fontSize: 14 }} className="hidden sm:block">My Dashboard</Link>
            <Link href="/signup" style={{ background: 'var(--brand)', color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Join Now</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--brand-light)', color: 'var(--brand)', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          🎮 It&apos;s a game. Every referral levels you up.
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, color: 'var(--text)', marginBottom: 20 }}>
          Turn your network<br /><span style={{ color: 'var(--brand)' }}>into real rewards.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Refer a friend to Flent. When they move in and complete a month, you unlock a reward. Keep going — milestones stack and so do the prizes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" style={{ display: 'inline-block', background: 'var(--brand)', color: '#fff', padding: '16px 40px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
            Get my referral code →
          </Link>
          <Link href="/dashboard" style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Already have a code? Log in
          </Link>
        </div>
      </section>

      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-center" style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>How it works</h2>
          <p className="text-center" style={{ color: 'var(--muted)', marginBottom: 48, fontSize: 16 }}>Three simple steps. Infinite rewards.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '✍️', title: 'Sign up', desc: 'Create your free referrer account in 60 seconds. You get a unique code instantly.' },
              { step: '02', icon: '📤', title: 'Share your code', desc: 'Send your code to friends looking for quality co-living in Bangalore. WhatsApp, DM, anywhere.' },
              { step: '03', icon: '🎁', title: 'Unlock rewards', desc: 'When your friend moves in and completes a month, you hit a milestone and claim your reward.' },
            ].map((item) => (
              <div key={item.step} style={{ background: 'var(--bg)', borderRadius: 16, padding: 28, border: '1px solid var(--border)' }}>
                <div style={{ width: 52, height: 52, background: 'var(--brand-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 8 }}>Step {item.step}</div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {milestones.length > 0 && (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-center" style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Your reward roadmap</h2>
            <p className="text-center" style={{ color: 'var(--muted)', marginBottom: 48, fontSize: 16 }}>Each milestone is a level-up. Redeem and start the next streak.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {milestones.map((m, i) => (
                <div key={m.id} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', textAlign: 'center', position: 'relative' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{REWARD_ICONS[i] ?? '🎁'}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>{m.referralsRequired} {m.referralsRequired === 1 ? 'referral' : 'referrals'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.rewardName}</div>
                  {m.rewardDescription && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{m.rewardDescription}</div>}
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>Tier {m.tierNumber}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', borderRadius: 24, padding: '48px 32px' }}>
            <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Ready to start earning?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 28 }}>Join the Flent community and earn rewards for every successful referral.</p>
            <Link href="/signup" style={{ display: 'inline-block', background: '#fff', color: 'var(--brand)', padding: '16px 40px', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
              Get my referral code — it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          © {new Date().getFullYear()} Flent · Bangalore ·{' '}
          <a href="https://flent.in/terms" style={{ color: 'var(--brand)' }}>Terms</a> ·{' '}
          <a href="https://flent.in/privacy" style={{ color: 'var(--brand)' }}>Privacy</a> ·{' '}
          Questions? <a href="mailto:sales@flent.in" style={{ color: 'var(--brand)' }}>sales@flent.in</a>
        </p>
      </footer>
    </main>
  )
}
