import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const zinDisplay = localFont({
  src: './fonts/ZinDisplay.otf',
  variable: '--font-serif',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

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
    <html lang="en" className={`h-full ${zinDisplay.variable} ${plusJakarta.variable}`}>
      <body className="min-h-full">
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
