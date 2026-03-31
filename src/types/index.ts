export interface TierData {
  tier: number;
  refs: number;
  emoji: string;
  prize: string;
  name: string;
  desc: string;
  symbols: [string, string, string];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StatItem {
  number: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

export interface HiwStep {
  num: string;
  badgeText: string;
  badgeIcon: string;
  title: string;
  text: string;
  cardBg: string;
}

export interface BoardCard {
  target: string;
  suffix: string;
  label: string;
  text: string;
  accentColor: string;
}
