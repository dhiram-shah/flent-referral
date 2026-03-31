'use client';

import { useEffect, useRef } from 'react';
import { marqueeLight, marqueeDark } from '@/lib/constants';

function MarqueeItems({ items, isDark }: { items: string[]; isDark?: boolean }) {
  // Repeat 3x for seamless loop
  const repeated = [...items, ...items, ...items];
  return (
    <>
      {repeated.map((text, i) => (
        <span key={i}>
          <span className="marquee-item">{text}</span>
          <span className="marquee-sep">✦</span>
        </span>
      ))}
    </>
  );
}

export default function MarqueeBands() {
  const lightRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    // Set initial offset
    if (lightRef.current) lightRef.current.style.transform = 'translateX(-33%)';
    if (darkRef.current) darkRef.current.style.transform = 'translateX(-33%)';

    const speed = 0.5;

    function onScroll() {
      const scrollY = window.scrollY;
      if (lightRef.current) {
        const offset = scrollY * speed * -1;
        lightRef.current.style.transform = `translateX(calc(-33% + ${offset}px))`;
      }
      if (darkRef.current) {
        const offset = scrollY * speed * 1;
        darkRef.current.style.transform = `translateX(calc(-33% + ${offset}px))`;
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
    <div className="marquee-section">
      <div className="marquee-band light" data-scroll-direction="left">
        <div className="marquee-inner" ref={lightRef}>
          <MarqueeItems items={marqueeLight} />
        </div>
      </div>
      <div className="marquee-band dark" data-scroll-direction="right">
        <div className="marquee-inner" ref={darkRef}>
          <MarqueeItems items={marqueeDark} isDark />
        </div>
      </div>
    </div>
  );
}
