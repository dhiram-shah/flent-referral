import { prisma } from './prisma'

export interface AmbassadorTier {
  id: number
  name: string
  minReferrals: number
  colorToken: string
  sortOrder: number
}

// colorToken values: 'info' | 'success' | 'brand' | 'warning'
// Mapped to CSS vars in the UI
export const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  info:    { color: 'var(--info)',    bg: 'var(--info-light)' },
  success: { color: 'var(--success)', bg: 'var(--success-light)' },
  brand:   { color: 'var(--brand)',   bg: 'var(--pastel-violet)' },
  warning: { color: '#D97706',        bg: '#FEF3C7' },
}

const DEFAULT_TIERS = [
  { name: 'Scout',      minReferrals: 1, colorToken: 'info',    sortOrder: 1 },
  { name: 'Connector',  minReferrals: 3, colorToken: 'success', sortOrder: 2 },
  { name: 'Ambassador', minReferrals: 6, colorToken: 'brand',   sortOrder: 3 },
]

export async function getAllTiers(): Promise<AmbassadorTier[]> {
  const tiers = await prisma.ambassadorTier.findMany({ orderBy: { sortOrder: 'asc' } })
  if (tiers.length === 0) {
    await prisma.ambassadorTier.createMany({ data: DEFAULT_TIERS })
    return prisma.ambassadorTier.findMany({ orderBy: { sortOrder: 'asc' } })
  }
  return tiers
}

export function computeTier(lifetimeCount: number, tiers: AmbassadorTier[]): AmbassadorTier | null {
  const sorted = [...tiers].sort((a, b) => b.minReferrals - a.minReferrals)
  return sorted.find((t) => lifetimeCount >= t.minReferrals) ?? null
}

export function getCurrentQuarter() {
  const now = new Date()
  const year = now.getFullYear()
  const quarter = Math.floor(now.getMonth() / 3)
  const startMonth = quarter * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 1)
  const names = ['Q1', 'Q2', 'Q3', 'Q4']
  return { start, end, label: `${names[quarter]} ${year}`, resetsOn: end }
}
