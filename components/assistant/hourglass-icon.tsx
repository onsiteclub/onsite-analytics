'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HourglassIconProps {
  size?: number;
  className?: string;
  theme?: 'entrada' | 'saida';
}

export function HourglassIcon({ size = 40, className, theme = 'entrada' }: HourglassIconProps) {
  const primaryColor = theme === 'entrada' ? '#06b6d4' : '#f59e0b'; // cyan-500 or amber-500
  const secondaryColor = theme === 'entrada' ? '#0ea5e9' : '#f97316'; // sky-500 or orange-500
  const glowColor = theme === 'entrada' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)';

  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-md"
        style={{ backgroundColor: glowColor }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        style={{ width: size, height: size }}
      >
        {/* Outer frame */}
        <path
          d="M8 4h24v2c0 6-4 10-8 12v4c4 2 8 6 8 12v2H8v-2c0-6 4-10 8-12v-4c-4-2-8-6-8-12V4z"
          stroke={primaryColor}
          strokeWidth="2"
          fill="none"
        />

        {/* Top cap */}
        <rect x="6" y="2" width="28" height="3" rx="1" fill={primaryColor} />

        {/* Bottom cap */}
        <rect x="6" y="35" width="28" height="3" rx="1" fill={primaryColor} />

        {/* Animated particles - top section */}
        {[...Array(5)].map((_, i) => (
          <motion.circle
            key={`top-${i}`}
            r="1.5"
            fill={secondaryColor}
            initial={{
              cx: 12 + Math.random() * 16,
              cy: 8 + Math.random() * 4,
              opacity: 0
            }}
            animate={{
              cy: [8 + Math.random() * 4, 18, 20],
              cx: [12 + Math.random() * 16, 20, 20],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.3]
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeIn'
            }}
          />
        ))}

        {/* Animated particles - bottom section (accumulating) */}
        {[...Array(5)].map((_, i) => (
          <motion.circle
            key={`bottom-${i}`}
            r="1.5"
            fill={secondaryColor}
            initial={{
              cx: 20,
              cy: 20,
              opacity: 0
            }}
            animate={{
              cy: [20, 30 - i * 2],
              cx: [20, 14 + Math.random() * 12],
              opacity: [0, 1, 1],
              scale: [0.3, 1, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.4 + 0.5,
              ease: 'easeOut'
            }}
          />
        ))}

        {/* Center stream */}
        <motion.line
          x1="20"
          y1="16"
          x2="20"
          y2="24"
          stroke={primaryColor}
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            opacity: [0.3, 1, 0.3],
            strokeWidth: [1, 2.5, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Time/space swirl effect */}
        <motion.path
          d="M16 10c2 1 4 1 8 0"
          stroke={secondaryColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              "M16 10c2 1 4 1 8 0",
              "M16 10c2 -1 4 -1 8 0",
              "M16 10c2 1 4 1 8 0"
            ],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        <motion.path
          d="M16 30c2 -1 4 -1 8 0"
          stroke={secondaryColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              "M16 30c2 -1 4 -1 8 0",
              "M16 30c2 1 4 1 8 0",
              "M16 30c2 -1 4 -1 8 0"
            ],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        />
      </svg>
    </div>
  );
}
