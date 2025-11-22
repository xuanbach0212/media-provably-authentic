'use client';

import { motion } from 'framer-motion';

interface SubwayLineProps {
  color: string;
  active: boolean;
  completed: boolean;
  width?: number;
}

export default function SubwayLine({ color, active, completed, width = 60 }: SubwayLineProps) {
  return (
    <div className="relative flex items-center" style={{ width: `${width}px`, height: '4px' }}>
      {/* Base line */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${color}30 0%, ${color}20 100%)`,
          height: '4px',
        }}
      />

      {/* Active/Completed line */}
      {(active || completed) && (
        <motion.div
          className="absolute inset-0"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: completed
              ? 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)'
              : `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
            height: '4px',
            boxShadow: active
              ? `0 0 10px ${color}, 0 0 20px ${color}80`
              : completed
              ? '0 0 10px #22C55E'
              : 'none',
            transformOrigin: 'left',
          }}
        />
      )}

      {/* Animated pulse for active */}
      {active && (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
            height: '6px',
            top: '-1px',
            filter: 'blur(2px)',
          }}
        />
      )}
    </div>
  );
}

