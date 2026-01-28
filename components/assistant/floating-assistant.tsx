'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HourglassIcon } from './hourglass-icon';
import { ChatModal } from './chat-modal';
import { useHourglassTheme } from '@/lib/theme';

const STORAGE_KEY = 'argus-position';
const DEFAULT_POSITION = { x: -80, y: -80 }; // Offset from bottom-right

export function FloatingAssistant() {
  const { theme } = useHourglassTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save position when dragging ends
  const handleDragEnd = (_: any, info: { point: { x: number; y: number } }) => {
    setIsDragging(false);
    // Convert to offset from bottom-right
    const newPosition = {
      x: info.point.x - window.innerWidth,
      y: info.point.y - window.innerHeight,
    };
    setPosition(newPosition);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosition));
  };

  const handleClick = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  // Determine icon theme based on current page theme
  const iconTheme = theme === 'saida' ? 'saida' : 'entrada';

  return (
    <>
      {/* Drag constraints (full viewport) */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-40"
      />

      {/* Floating Icon */}
      <motion.div
        className="fixed z-50 cursor-pointer"
        style={{
          right: -position.x,
          bottom: -position.y,
        }}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          onClick={handleClick}
          className="relative"
          animate={{
            rotate: isOpen ? 180 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Pulse ring when closed */}
          {!isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: iconTheme === 'entrada' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          <div className="bg-card border-2 border-border rounded-full p-2 shadow-lg">
            <HourglassIcon size={36} theme={iconTheme} />
          </div>
        </motion.div>
      </motion.div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <ChatModal
            onClose={() => setIsOpen(false)}
            position={position}
          />
        )}
      </AnimatePresence>
    </>
  );
}
