import type { TierData, FaqItem, StatItem, HiwStep, BoardCard } from '@/types';

export const tierData: TierData[] = [
  { tier: 1, refs: 1, emoji: '🎁', prize: '₹3,000', name: 'Amazon Voucher', desc: 'Amazon gift card, delivered via email', symbols: ['🎁', '🛍️', '📦'] },
  { tier: 2, refs: 2, emoji: '🍔', prize: '₹5,000', name: 'Swiggy Credits', desc: 'Swiggy credits added to your account', symbols: ['🍔', '🍕', '🍜'] },
  { tier: 3, refs: 4, emoji: '🎧', prize: 'AirPods', name: 'Apple AirPods (2nd Gen)', desc: 'Couriered to your address', symbols: ['🎧', '🎵', '🎶'] },
  { tier: 4, refs: 7, emoji: '✈️', prize: '₹15,000', name: 'Travel Voucher', desc: 'MakeMyTrip or Cleartrip — your pick', symbols: ['✈️', '🌴', '🗺️'] },
  { tier: 5, refs: 10, emoji: '💎', prize: '₹25,000', name: 'Experience Voucher', desc: 'Your choice — travel, shopping, or dining', symbols: ['💎', '👑', '🏆'] },
];

export const allSymbols = ['🎁', '🛍️', '📦', '🍔', '🍕', '🍜', '🎧', '🎵', '🎶', '✈️', '🌴', '🗺️', '💎', '👑', '🏆'];

export const bannerColors = [
  'var(--pastel-orange)',
  'var(--pastel-pink)',
  'var(--pastel-violet)',
  'var(--pastel-cyan)',
  'var(--pastel-yellow)',
];

export const confettiColors = ['#ff9a6d', '#93f2e9', '#ff90b3', '#ffe98a', '#dad7f4', '#cff0e9', '#ffa37b'];

export const stats: StatItem[] = [
  { number: '₹0', label: 'to join', desc: 'Free forever, no fees', color: 'var(--forest-green)', bg: 'rgba(0,142,117,0.06)' },
  { number: '∞', label: 'referrals', desc: 'No cap, ever', color: 'var(--coral-accent)', bg: 'rgba(255,154,109,0.08)' },
  { number: '12', label: 'rewards to unlock', desc: 'Each one bigger than the last', color: 'var(--info)', bg: 'rgba(51,40,115,0.06)' },
];

export const hiwSteps: HiwStep[] = [
  {
    num: '01',
    badgeText: '60 seconds to start',
    badgeIcon: '/assets/icon-clock.svg',
    title: 'Create your free account',
    text: 'Sign up in under a minute and get a permanent referral code instantly. No approval, no waitlist, no fees. Just your unique link to share.',
    cardBg: 'var(--pastel-orange)',
  },
  {
    num: '02',
    badgeText: 'Share anywhere',
    badgeIcon: '/assets/icon-clock.svg',
    title: 'Share your code with friends',
    text: 'Send it to anyone moving to Bangalore — WhatsApp, Instagram, email. They enter your code when they enquire about a Flent home. First code entered wins.',
    cardBg: 'var(--pastel-violet)',
  },
  {
    num: '03',
    badgeText: 'Rewards stack, no cap',
    badgeIcon: '/assets/icon-clock.svg',
    title: 'Unlock rewards as they move in',
    text: 'When your friend signs an agreement and completes their first month, you hit a milestone and earn a reward. Build your streak — each level unlocks something better.',
    cardBg: 'var(--pastel-green)',
  },
];

export const marqueeLight = [
  'They move in happy.',
  'You earn something real.',
  'The best kind of win-win.',
  'Good karma, guaranteed.',
  'Your friend thanks you forever.',
];

export const marqueeDark = [
  "Friends don't let friends pay brokers.",
  'Move-in ready. Reward ready.',
  'Flent homes. Real rewards.',
  'Every milestone, something better.',
  'Refer once. Earn for real.',
  'Your network = your net worth.',
];

export const boardCards: BoardCard[] = [
  { target: '1', suffix: 'Cr+', label: 'Funded', text: 'Invested by landlords & tenants in our last round', accentColor: 'var(--danger)' },
  { target: '450', suffix: '+', label: 'Happy tenants', text: 'Living in Flent homes across Bangalore', accentColor: 'var(--forest-green)' },
  { target: '200', suffix: '+', label: 'Items per home', text: 'Fully furnished — walk in ready to live', accentColor: 'var(--orange-32)' },
];

export const faqItems: FaqItem[] = [
  {
    question: 'Who can refer? Do I need to be a Flent tenant?',
    answer: "Not at all — anyone can join. You don't need to be living at a Flent property. If you know someone looking for quality housing in Bangalore, your code works for them.",
  },
  {
    question: 'When exactly do I earn a reward?',
    answer: 'You earn when your referred friend (1) signs a rental agreement with Flent, and (2) completes their first month. Both conditions must be met. This typically takes 6–10 weeks from enquiry.',
  },
  {
    question: 'How will I receive my reward?',
    answer: 'Our team reaches out within 7 days of your milestone unlock to coordinate the reward. Delivery format depends on the prize — voucher, bank transfer, or physical item.',
  },
  {
    question: 'Can I refer more than one person?',
    answer: 'Yes — every successful referral counts toward your streak. Rewards improve at each milestone tier. The more you refer, the better it gets — there is no cap.',
  },
  {
    question: "What if my friend entered someone else's code?",
    answer: "The first code entered on the Flent enquiry form is the one that counts. We cannot change this after the fact — so make sure your friend has your code before they fill out any enquiry form.",
  },
  {
    question: 'Do referral codes expire?',
    answer: "Never. Your code is permanent and always active. There's no deadline — refer someone today or six months from now, it works the same.",
  },
];

export const coinDisplayData = [
  { tier: 'Tier 1', number: '1', label: 'Referral', prize: '₹3K Amazon' },
  { tier: 'Tier 2', number: '2', label: 'Referrals', prize: '₹5K Swiggy' },
  { tier: 'Tier 3', number: '4', label: 'Referrals', prize: 'AirPods' },
  { tier: 'Tier 4', number: '7', label: 'Referrals', prize: '₹15K Travel' },
  { tier: 'Tier 5', number: '10', label: 'Referrals', prize: '₹25K Grand' },
];
