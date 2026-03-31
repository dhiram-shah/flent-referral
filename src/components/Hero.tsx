'use client';

import { motion } from 'framer-motion';
import TypingText from './TypingText';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: -12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="hero-badge-dot" />
          <span className="hero-badge-text">Open to everyone — tenants and non-tenants</span>
        </motion.div>

        <div className="hero-title">
          <TypingText
            text="Refer friends to Flent."
            className="hero-title-line1"
            tag="div"
            charDelay={0.02}
            startDelay={0.25}
            once
          />
          <TypingText
            text="Earn real rewards."
            className="hero-title-line2"
            tag="div"
            charDelay={0.025}
            startDelay={0.7}
            once
          />
        </div>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.15, ease: [0.25, 1, 0.5, 1] }}
        >
          Share your code. Friend moves in. You earn — and every milestone gets better.
        </motion.p>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.35, ease: [0.25, 1, 0.5, 1] }}
        >
          <motion.button
            className="btn-base btn-pill"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Get my referral code →
          </motion.button>
          <p className="hero-cta-sub">
            Already a member? <a href="#">Track your progress →</a>
          </p>
        </motion.div>

        <div className="hero-bottom" />
      </div>
    </section>
  );
}
