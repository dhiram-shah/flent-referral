'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface TypingTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'span';
  charDelay?: number;
  startDelay?: number;
  once?: boolean;
}

export default function TypingText({
  text,
  className = '',
  tag = 'div',
  charDelay = 0.018,
  startDelay = 0,
  once = false,
}: TypingTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.3, margin: '0px 0px -40px 0px' });

  const Tag = motion[tag] as typeof motion.div;
  const words = text.split(' ');

  let charIndex = 0;

  return (
    <Tag
      ref={ref}
      className={className}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={wi} style={{ whiteSpace: 'nowrap' }}>
          {word.split('').map((char) => {
            const i = charIndex++;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{
                  duration: 0.15,
                  delay: startDelay + i * charDelay,
                  ease: [0.25, 1, 0.5, 1],
                }}
                style={{ display: 'inline-block' }}
              >
                {char}
              </motion.span>
            );
          })}
          {wi < words.length - 1 && (() => {
            charIndex++; // count the space
            return ' ';
          })()}
        </span>
      ))}
    </Tag>
  );
}
