'use client';

import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { COIN_DATA, drawCoin } from '@/utils/coinRenderer';
import type { CoinMeta } from '@/utils/coinRenderer';

export default function CoinRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const metaRef = useRef<CoinMeta[]>([]);
  const animRef = useRef<number>(0);
  const dimensionsRef = useRef({ W: 0, H: 0 });
  const shelfRef = useRef<Matter.Body | null>(null);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    Matter.Engine.update(engine, 1000 / 60);

    const dpr = window.devicePixelRatio || 1;
    const H = dimensionsRef.current.H;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Remove coins that fell well below the canvas
    for (let i = bodiesRef.current.length - 1; i >= 0; i--) {
      const body = bodiesRef.current[i];
      // Only remove if below canvas AND not resting on shelf
      const isResting = shelfRef.current && Math.abs(body.velocity.y) < 0.5 && body.position.y < H;
      if (body.position.y > H + 400 && !isResting) {
        Matter.Composite.remove(engine.world, body);
        bodiesRef.current.splice(i, 1);
        metaRef.current.splice(i, 1);
      }
    }

    // Once all coins are gone, stop
    if (bodiesRef.current.length === 0) {
      cancelAnimationFrame(animRef.current);
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }
      return;
    }

    for (let i = 0; i < bodiesRef.current.length; i++) {
      drawCoin(ctx, bodiesRef.current[i], metaRef.current[i], dpr);
    }

    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    dimensionsRef.current = { W, H };
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.2 } });
    engineRef.current = engine;

    // Find marquee and place a shelf at its top edge
    const marquee = document.querySelector('.marquee-section');
    let shelfY = H * 0.85; // fallback if marquee not found
    if (marquee) {
      const rect = marquee.getBoundingClientRect();
      shelfY = rect.top;
    }

    // Shelf spans full width — "stay" coins will land here
    // Use collision filter: shelf is category 0x0002
    const shelf = Matter.Bodies.rectangle(W / 2, shelfY, W + 200, 10, {
      isStatic: true,
      friction: 0.9,
      restitution: 0.15,
      collisionFilter: { category: 0x0002, mask: 0x0002 },
    });
    Matter.Composite.add(engine.world, shelf);
    shelfRef.current = shelf;

    const isMobile = W < 768;
    const coinCount = isMobile ? 14 : 22;
    const stayCount = isMobile ? 4 : 6;
    const baseSize = Math.min(W / 12, 40);

    const bodies: Matter.Body[] = [];
    const meta: CoinMeta[] = [];

    for (let i = 0; i < coinCount; i++) {
      const coinMeta = COIN_DATA[i % COIN_DATA.length];
      const radius = baseSize * 0.6 + Math.random() * (baseSize * 0.6);
      const x = radius + Math.random() * (W - radius * 2);
      const y = -(50 + Math.random() * 500);

      // "Stay" coins collide with shelf (category 0x0002), "fall" coins don't
      const shouldStay = i < stayCount;

      const body = Matter.Bodies.circle(x, y, radius, {
        restitution: 0.3,
        friction: 0.5,
        frictionAir: 0.005,
        density: 0.002,
        collisionFilter: shouldStay
          ? { category: 0x0002, mask: 0x0002 }  // collides with shelf + other stay coins
          : { category: 0x0004, mask: 0x0004 },  // only collides with other fall coins
      });

      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2,
        y: 1 + Math.random() * 2,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);

      bodies.push(body);
      meta.push(coinMeta);
    }

    Matter.Composite.add(engine.world, bodies);
    bodiesRef.current = bodies;
    metaRef.current = meta;

    animRef.current = requestAnimationFrame(animate);

    // After 5s, remove the shelf so resting coins fall away
    const shelfTimer = setTimeout(() => {
      if (shelfRef.current && engineRef.current) {
        Matter.Composite.remove(engineRef.current.world, shelfRef.current);
        shelfRef.current = null;
      }
    }, 5000);

    return () => {
      clearTimeout(shelfTimer);
      cancelAnimationFrame(animRef.current);
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
