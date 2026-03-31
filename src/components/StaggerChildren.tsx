'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  once?: boolean;
}

const containerVariants = (stagger: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: 0.05,
    },
  },
});

export const childVariants = (y: number) => ({
  hidden: { opacity: 0, y },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
    },
  },
});

export default function StaggerChildren({
  children,
  className = '',
  stagger = 0.06,
  y = 25,
  once = false,
}: StaggerChildrenProps) {
  return (
    <motion.div
      className={className}
      variants={containerVariants(stagger)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15, margin: '0px 0px -40px 0px' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '', y = 25 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div className={className} variants={childVariants(y)}>
      {children}
    </motion.div>
  );
}
