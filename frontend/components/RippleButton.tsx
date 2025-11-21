'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, MouseEvent } from 'react';

interface RippleButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

/**
 * Button with ripple effect on click
 * Level 3 Premium UI component
 */
export default function RippleButton({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      x,
      y,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </motion.button>
  );
}

