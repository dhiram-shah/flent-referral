'use client';

import { motion } from 'framer-motion';
import StaggerChildren, { StaggerItem } from './StaggerChildren';

const stats = [
  { number: '₹0', label: 'to join', desc: 'Free forever, no fees' },
  { number: '∞', label: 'referrals', desc: 'No cap, ever' },
  { number: '12', label: 'rewards to unlock', desc: 'Each one bigger than the last' },
];

export default function StatsBar() {
  return (
    <section className="stats-bar">
      <StaggerChildren className="stats-bar-inner" stagger={0.12}>
        {stats.map((stat, i) => (
          <StaggerItem key={i}>
            <motion.div
              className="stat-item"
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label-inline">{stat.label}</span>
              <span className="stat-desc">{stat.desc}</span>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </section>
  );
}
