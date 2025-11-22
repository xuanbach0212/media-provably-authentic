'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { DESIGN_TOKENS, createCardStyle, createSectionHeaderStyle } from '@/styles/design-system';

interface ConsistentCardProps {
  children: ReactNode;
  accentColor?: string;
  className?: string;
  animate?: boolean;
}

export default function ConsistentCard({ 
  children, 
  accentColor, 
  className = '',
  animate = true,
}: ConsistentCardProps) {
  const cardStyle = createCardStyle(accentColor);

  const CardWrapper = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  } : {};

  return (
    <CardWrapper
      className={`w-full ${className}`}
      style={cardStyle}
      {...animationProps}
    >
      {children}
    </CardWrapper>
  );
}

interface SectionHeaderProps {
  children: ReactNode;
  accentColor: string;
  icon?: ReactNode;
}

export function SectionHeader({ children, accentColor, icon }: SectionHeaderProps) {
  const headerStyle = createSectionHeaderStyle(accentColor);

  return (
    <div 
      className="flex items-center gap-3 text-white"
      style={headerStyle}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

