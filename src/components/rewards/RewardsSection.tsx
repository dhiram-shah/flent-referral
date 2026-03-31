'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tierData, allSymbols, bannerColors, coinDisplayData } from '@/lib/constants';
import { launchConfetti } from '@/lib/confetti';
import type { TierData } from '@/types';
import ScrollReveal from '../ScrollReveal';
import TypingText from '../TypingText';
import StaggerChildren, { StaggerItem } from '../StaggerChildren';

export default function RewardsSection() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeCoin, setActiveCoin] = useState<number | null>(null);
  const [machineState, setMachineState] = useState<'idle' | 'spinning' | 'won'>('idle');
  const [popupData, setPopupData] = useState<TierData | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const buildReel = useCallback((reelIndex: number, winSymbol: string) => {
    const track = reelRefs.current[reelIndex];
    if (!track) return track;
    track.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 20; i++) {
      const div = document.createElement('div');
      div.className = 'slot-reel-item';
      div.textContent = allSymbols[Math.floor(Math.random() * allSymbols.length)];
      frag.appendChild(div);
    }
    const winDiv = document.createElement('div');
    winDiv.className = 'slot-reel-item';
    winDiv.textContent = winSymbol;
    frag.appendChild(winDiv);
    track.appendChild(frag);
    track.style.transition = 'none';
    track.style.transform = 'translateY(0)';
    return track;
  }, []);

  const spinSlot = useCallback((tierIndex: number) => {
    if (isSpinning) return;
    setIsSpinning(true);
    setActiveCoin(tierIndex);
    setMachineState('spinning');

    const data = tierData[tierIndex];
    const winSymbol = data.symbols[0];

    const tracks = [
      buildReel(0, winSymbol),
      buildReel(1, winSymbol),
      buildReel(2, winSymbol),
    ];

    if (tracks[0]) void tracks[0].offsetHeight;

    const firstItem = tracks[0]?.querySelector('.slot-reel-item') as HTMLElement | null;
    const itemH = firstItem?.offsetHeight || 128;
    const stopAt = -(20 * itemH);

    tracks.forEach((track, i) => {
      if (!track) return;
      const delay = i * 300;
      const duration = 1.6 + i * 0.4;
      setTimeout(() => {
        track.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.35, 1)`;
        track.style.transform = `translateY(${stopAt}px)`;
      }, delay);
    });

    const totalDuration = (1.6 + 2 * 0.4) * 1000 + 2 * 300 + 400;
    setTimeout(() => {
      setMachineState('won');
      setPopupData(data);
      setShowPopup(true);
      launchConfetti();
      setIsSpinning(false);
    }, totalDuration);
  }, [isSpinning, buildReel]);

  const closePopup = useCallback(() => {
    setShowPopup(false);
    setMachineState('idle');
    setActiveCoin(null);
    reelRefs.current.forEach(track => {
      if (!track) return;
      track.style.transition = 'none';
      track.style.transform = 'translateY(0)';
      track.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'slot-reel-item';
      div.textContent = allSymbols[Math.floor(Math.random() * allSymbols.length)];
      track.appendChild(div);
    });
  }, []);

  const handleClaim = useCallback(() => {
    closePopup();
    document.querySelector('.footer-mega')?.scrollIntoView({ behavior: 'smooth' });
  }, [closePopup]);

  return (
    <section className="rewards">
      <div className="rewards-bg" />
      <div className="rewards-inner">
        <ScrollReveal>
          <div className="section-label centered white">Reward Journey</div>
        </ScrollReveal>
        <TypingText
          text="Every referral, a better reward"
          className="rewards-title"
          tag="h2"
          charDelay={0.015}
          startDelay={0.08}
        />
        <ScrollReveal delay={0.15}>
          <p className="rewards-desc">Build your streak. Each move-in unlocks the next tier — and the prizes keep getting better.</p>
        </ScrollReveal>

        {/* Tier Coins */}
        <StaggerChildren className={`slot-coins${activeCoin !== null ? ' has-active' : ''}`} stagger={0.08}>
          {coinDisplayData.map((coin, i) => (
            <StaggerItem key={i} y={20}>
              <motion.div
                className={`slot-coin${activeCoin === i ? ' active' : ''}`}
                data-tier={i + 1}
                onClick={() => spinSlot(i)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="slot-coin-tier">{coin.tier}</span>
                <span className="slot-coin-number">{coin.number}</span>
                <span className="slot-coin-label">{coin.label}</span>
                <span className="slot-coin-prize">{coin.prize}</span>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Slot Machine */}
        <ScrollReveal y={35} duration={0.5}>
          <div className={`slot-machine${machineState === 'spinning' ? ' spinning' : ''}${machineState === 'won' ? ' won' : ''}`}>
            <div className="slot-machine-top">
              <div className="slot-machine-light" />
              <div className="slot-machine-light" />
              <div className="slot-machine-light" />
              <span className="slot-machine-label">Flent Rewards</span>
              <div className="slot-machine-light" />
              <div className="slot-machine-light" />
              <div className="slot-machine-light" />
            </div>
            <div className="slot-reels">
              {[0, 1, 2].map(i => (
                <div className="slot-reel" key={i}>
                  <div
                    className="slot-reel-track"
                    ref={(el) => { reelRefs.current[i] = el; }}
                  />
                </div>
              ))}
            </div>
            <div className="slot-prompt">Pick a coin to spin &amp; reveal your reward</div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="rewards-footnote">Streak resets only when you redeem — never for missing a month.</p>
        </ScrollReveal>
      </div>

      {/* Portal overlay + confetti to body */}
      {mounted && createPortal(
        <>
          <AnimatePresence>
            {showPopup && (
              <motion.div
                className="slot-overlay visible"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="slot-popup"
                  initial={{ y: 30, scale: 0.92, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: 15, scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 400 }}
                  style={{ transform: 'none' }}
                >
                  <div className="slot-popup-banner" style={{ background: popupData ? bannerColors[popupData.tier - 1] : undefined }}>
                    <motion.div
                      className="slot-popup-emoji-ring"
                      style={{ background: 'var(--white)' }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 300, delay: 0.08 }}
                    >
                      <div className="slot-popup-emoji">{popupData?.emoji}</div>
                    </motion.div>
                    <motion.div
                      className="slot-popup-tier"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.25 }}
                    >
                      TIER {popupData?.tier}{popupData?.tier === 5 ? ' — GRAND PRIZE' : ''}
                    </motion.div>
                  </div>
                  <div className="slot-popup-body">
                    <motion.div
                      className="slot-popup-prize"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                    >
                      {popupData?.prize}
                    </motion.div>
                    <motion.div
                      className="slot-popup-name"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.18 }}
                    >
                      {popupData?.name}
                    </motion.div>
                    <motion.div
                      className="slot-popup-desc"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.22 }}
                    >
                      {popupData?.desc}
                    </motion.div>
                    <motion.div
                      className="slot-popup-referrals"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.26, type: 'spring', stiffness: 500 }}
                    >
                      {popupData && `${popupData.refs} ${popupData.refs === 1 ? 'referral needed' : 'referrals needed'}`}
                    </motion.div>
                    <motion.div
                      className="slot-popup-actions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.25 }}
                    >
                      <button className="slot-popup-cta-secondary" onClick={closePopup}>Try another tier</button>
                      <button className="slot-popup-cta" onClick={handleClaim}>Start referring</button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </section>
  );
}
