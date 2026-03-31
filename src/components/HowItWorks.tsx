'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { hiwSteps } from '@/lib/constants';
import TypingText from './TypingText';
import ScrollReveal from './ScrollReveal';
import Image from 'next/image';

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackFillRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (!stepsRef.current) return;
      const viewMid = window.innerHeight * 0.55;
      let newActive = 0;

      stepRefs.current.forEach((step, i) => {
        if (step) {
          const rect = step.getBoundingClientRect();
          const stepMid = rect.top + rect.height / 2;
          if (stepMid < viewMid) newActive = i;
        }
      });

      setActiveIndex(newActive);

      if (trackFillRef.current && stepRefs.current[0] && stepRefs.current[newActive]) {
        const firstNode = stepRefs.current[0]?.querySelector('.hiw-step-node') as HTMLElement;
        const activeNode = stepRefs.current[newActive]?.querySelector('.hiw-step-node') as HTMLElement;
        if (firstNode && activeNode) {
          const startY = firstNode.offsetTop + 20;
          const endY = activeNode.offsetTop + 20;
          trackFillRef.current.style.top = `${startY}px`;
          trackFillRef.current.style.height = `${endY - startY}px`;
        }
      }
    }

    function rafScroll() {
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(() => {
          onScroll();
          tickingRef.current = false;
        });
      }
    }

    window.addEventListener('scroll', rafScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', rafScroll);
  }, []);

  return (
    <section className="how-it-works">
      <div className="hiw-header">
        <ScrollReveal>
          <div className="section-label centered">How it works</div>
        </ScrollReveal>
        <TypingText
          text="How Flent Referrals Work"
          className="hiw-title"
          tag="h2"
          charDelay={0.018}
          startDelay={0.08}
        />
        <ScrollReveal delay={0.15}>
          <p className="hiw-desc">A simple, trackable journey — built to feel private, premium, and worth sharing.</p>
        </ScrollReveal>
      </div>

      <div className="hiw-steps" ref={stepsRef}>
        <div className="hiw-track-fill" ref={trackFillRef} />
        {hiwSteps.map((step, i) => (
          <motion.div
            key={i}
            className={`hiw-step${i <= activeIndex ? ' active' : ''}`}
            data-step={i + 1}
            ref={(el) => { stepRefs.current[i] = el; }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{
              duration: 0.4,
              delay: i * 0.06,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            <div className="hiw-step-node">{i + 1}</div>
            <div className="hiw-step-card">
              <div className="hiw-step-header">
                <div className="hiw-step-num">{step.num}</div>
                <div className="hiw-step-badge">
                  <Image src={step.badgeIcon} alt="" width={14} height={14} />
                  <span>{step.badgeText}</span>
                </div>
              </div>
              <div className="hiw-step-body">
                <h3 className="hiw-step-title">{step.title}</h3>
                <p className="hiw-step-text">{step.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
