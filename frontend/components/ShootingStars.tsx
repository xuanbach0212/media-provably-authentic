'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Star {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
}

export default function ShootingStars() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generateStar = () => {
      const startX = Math.random() * 100;
      const startY = Math.random() * 50;
      const endX = startX + 30 + Math.random() * 20;
      const endY = startY + 30 + Math.random() * 20;
      
      return {
        id: Date.now() + Math.random(),
        startX,
        startY,
        endX,
        endY,
        delay: Math.random() * 2,
      };
    };

    // Generate initial stars
    const initialStars = Array.from({ length: 3 }, generateStar);
    setStars(initialStars);

    // Generate new star every 3-8 seconds
    const interval = setInterval(() => {
      const newStar = generateStar();
      setStars(prev => [...prev.slice(-2), newStar]);
    }, 3000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <AnimatePresence>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute"
            initial={{
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              opacity: 0,
            }}
            animate={{
              left: `${star.endX}%`,
              top: `${star.endY}%`,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: star.delay,
              ease: 'easeOut',
            }}
            style={{
              width: '2px',
              height: '2px',
            }}
          >
            {/* Star trail */}
            <motion.div
              className="absolute w-16 h-0.5 bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent"
              style={{
                transform: 'rotate(-45deg)',
                transformOrigin: 'left center',
                filter: 'blur(1px)',
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ 
                scaleX: [0, 1, 1, 0],
                opacity: [0, 1, 0.8, 0],
              }}
              transition={{
                duration: 1.5,
                delay: star.delay,
                ease: 'easeOut',
              }}
            />
            
            {/* Star glow */}
            <motion.div
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: `radial-gradient(circle, var(--theme-primary) 0%, transparent 70%)`,
                left: '-8px',
                top: '-8px',
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 1.5,
                delay: star.delay,
                ease: 'easeOut',
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

