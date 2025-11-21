/**
 * Framer Motion Animation Variants
 * Premium animations for Level 3 UI
 */

import { Variants } from 'framer-motion';

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

// Fade in with stagger children
export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

// Slide in from directions
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
};

export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
};

export const slideInBottom: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
};

export const slideInTop: Variants = {
  hidden: {
    opacity: 0,
    y: -60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
};

// Scale animations
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};

// 3D card flip
export const cardFlip: Variants = {
  hidden: {
    opacity: 0,
    rotateY: -90,
  },
  visible: {
    opacity: 1,
    rotateY: 0,
    transition: {
      type: 'spring',
      stiffness: 60,
      damping: 15,
    },
  },
};

// Expandable section
export const expandCollapse: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
      opacity: {
        duration: 0.3,
        delay: 0.1,
      },
    },
  },
};

// Hover lift
export const hoverLift = {
  rest: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// Button press
export const buttonPress = {
  rest: {
    scale: 1,
  },
  press: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

// Icon rotate
export const iconRotate: Variants = {
  collapsed: {
    rotate: 0,
  },
  expanded: {
    rotate: 180,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Progress bar growth
export const progressGrow: Variants = {
  initial: {
    width: '0%',
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// Number counting animation (for charts)
export const numberCount = (from: number, to: number) => ({
  initial: from,
  animate: to,
  transition: {
    duration: 1.5,
    ease: 'easeOut',
  },
});

// Stagger children with fade + slide
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Card entrance animation
export const cardEntrance: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

// Glow pulse animation
export const glowPulse: Variants = {
  initial: {
    boxShadow: '0 0 10px rgba(77, 162, 255, 0.3)',
  },
  animate: {
    boxShadow: [
      '0 0 10px rgba(77, 162, 255, 0.3)',
      '0 0 30px rgba(77, 162, 255, 0.6)',
      '0 0 10px rgba(77, 162, 255, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Rotate animation
export const rotate360: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Spring config presets
export const springConfig = {
  gentle: { type: 'spring' as const, stiffness: 80, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 200, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 10 },
};

// Transition presets
export const transitionConfig = {
  smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
};

