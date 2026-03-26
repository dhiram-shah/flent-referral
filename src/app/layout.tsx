import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flent Referral Program — Refer Friends, Earn Rewards',
  description:
    'Join the Flent Referral Program. Share your unique code with friends looking for quality co-living in Bangalore and earn exciting rewards for every successful referral.',
  openGraph: {
    title: 'Flent Referral Program',
    description: 'Refer friends to Flent and unlock amazing rewards.',
    url: 'https://flent.in/referral-program',
    siteName: 'Flent',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
