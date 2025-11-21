'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number; // 0-1, default 0.5
}

/**
 * 3D Card with mouse-tracking rotation
 * Level 3 Premium UI component
 */
export default function Card3D({ children, className = '', intensity = 0.5 }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10 * intensity, -10 * intensity]), {
    stiffness: 300,
    damping: 30,
  });
  
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10 * intensity, 10 * intensity]), {
    stiffness: 300,
    damping: 30,
  });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };
  
  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-container"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className={`preserve-3d ${className}`}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          scale: 1.02,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
          },
        }}
      >
        <motion.div
          style={{
            boxShadow: useTransform(
              [mouseX, mouseY],
              ([x, y]: any) => {
                const shadowX = x * 20;
                const shadowY = y * 20;
                const shadowBlur = 40 + Math.abs(x * 10) + Math.abs(y * 10);
                return `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(77, 162, 255, 0.3)`;
              }
            ),
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

