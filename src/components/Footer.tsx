'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Matter from 'matter-js';
import ScrollReveal from './ScrollReveal';
import TypingText from './TypingText';
import { COIN_DATA, drawCoin as drawCoinUtil } from '@/utils/coinRenderer';
import type { CoinMeta } from '@/utils/coinRenderer';

const COIN_COUNT = 16;

export default function Footer() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderDataRef = useRef<{ bodies: Matter.Body[]; coinMeta: CoinMeta[] } | undefined>(undefined);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const animRef = useRef<number>(0);
  const hasTriggeredRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    const data = renderDataRef.current;
    if (!canvas || !engine || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    Matter.Engine.update(engine, 1000 / 60);

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < data.bodies.length; i++) {
      drawCoinUtil(ctx, data.bodies[i], data.coinMeta[i], dpr);
    }

    animRef.current = requestAnimationFrame(animate);
  }, []);

  const setup = useCallback(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = scene.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.4 } });
    engineRef.current = engine;

    const floorY = H - 50;
    const wallOpts = { isStatic: true, friction: 0.9, restitution: 0.15 };
    const floor = Matter.Bodies.rectangle(W / 2, floorY + 25, W + 200, 50, wallOpts);
    const leftWall = Matter.Bodies.rectangle(-25, H / 2, 50, H * 2, wallOpts);
    const rightWall = Matter.Bodies.rectangle(W + 25, H / 2, 50, H * 2, wallOpts);
    Matter.Composite.add(engine.world, [floor, leftWall, rightWall]);

    const bodies: Matter.Body[] = [];
    const coinMeta: CoinMeta[] = [];
    const baseSize = Math.min(W / 8, 70);

    for (let i = 0; i < COIN_COUNT; i++) {
      const meta = COIN_DATA[i % COIN_DATA.length];
      const radius = baseSize * 0.8 + Math.random() * (baseSize * 0.6);
      const x = 80 + Math.random() * (W - 160);
      const y = -(100 + Math.random() * 600);

      const body = Matter.Bodies.circle(x, y, radius, {
        restitution: 0.3,
        friction: 0.7,
        frictionAir: 0.006,
        density: 0.002,
      });

      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2.5,
        y: 1 + Math.random() * 2,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);

      bodies.push(body);
      coinMeta.push(meta);
    }

    Matter.Composite.add(engine.world, bodies);
    renderDataRef.current = { bodies, coinMeta };

    const mouse = Matter.Mouse.create(canvas);
    mouse.pixelRatio = dpr;

    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.6,
        damping: 0.1,
        render: { visible: false },
      },
    });
    Matter.Composite.add(engine.world, mouseConstraint);
    mouseConstraintRef.current = mouseConstraint;

    animRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }
    renderDataRef.current = undefined;
    mouseConstraintRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setIsVisible(true);
            setup();
          } else if (!entry.isIntersecting && hasTriggeredRef.current) {
            hasTriggeredRef.current = false;
            setIsVisible(false);
            cleanup();
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(scene);
    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [setup, cleanup]);

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!hasTriggeredRef.current) return;
        cleanup();
        setup();
      }, 200);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [setup, cleanup]);

  return (
    <footer className="footer-mega" ref={sceneRef}>
      {/* CTA content */}
      <div className="footer-mega-cta">
        <TypingText
          text="Your next reward is"
          className="cta-title"
          tag="h2"
          charDelay={0.02}
          startDelay={0.05}
        />
        <ScrollReveal delay={0.25}>
          <div className="cta-title-italic">one referral away.</div>
        </ScrollReveal>
        <ScrollReveal delay={0.38}>
          <p className="cta-desc">Free to join. Takes under a minute. Your code is waiting.</p>
        </ScrollReveal>
        <ScrollReveal delay={0.48}>
          <div className="cta-buttons">
            <motion.a
              href="/signup"
              className="btn-base btn-pill-dark"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Get my referral code — it&apos;s free
            </motion.a>
            <a href="/login" className="cta-signin">Already a member? Sign in →</a>
          </div>
        </ScrollReveal>
      </div>

      {/* Physics canvas */}
      <canvas ref={canvasRef} className="footer-mega-canvas" />

      {/* Bottom bar */}
      <motion.div
        className="footer-mega-bar"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        <p className="footer-copy">&copy; 2026 Flent. All rights reserved.</p>
        <div className="footer-links">
          <a href="https://www.flent.in/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <a href="https://www.flent.in/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Service</a>
          <a href="mailto:sales@flent.in">Contact</a>
        </div>
      </motion.div>
    </footer>
  );
}
