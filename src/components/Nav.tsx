'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Nav() {
  return (
    <div className="nav-wrapper" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <nav className="nav">
        <motion.div
          className="nav-logo"
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 1, 0.5, 1] }}
        >
          <Image src="/assets/flent-logo.png" alt="Flent" width={60} height={22} priority />
        </motion.div>
        <motion.div
          className="nav-buttons"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
        >
          <button className="btn-base btn-pastel-peach" onClick={() => { window.location.href = '/login'; }}>Sign in</button>
          <button className="btn-base btn-pastel-violet" onClick={() => { window.location.href = '/signup'; }}>Join — it&apos;s free</button>
        </motion.div>
      </nav>
    </div>
  );
}
