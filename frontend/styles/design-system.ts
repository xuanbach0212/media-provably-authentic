/**
 * Design System - Consistent Styling
 * All components should use these tokens for consistency
 */

export const DESIGN_TOKENS = {
  // Card System
  card: {
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(31, 41, 55, 0.8)',
    background: 'rgba(17, 24, 39, 0.5)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },

  // Section Headers
  sectionHeader: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '16px',
    paddingBottom: '12px',
  },

  // Spacing
  spacing: {
    sectionGap: '32px',
    cardPadding: '24px',
    contentGap: '16px',
  },

  // Colors - Sui Inspired
  colors: {
    primary: '#4DA2FF',
    secondary: '#06B6D4',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Accent colors for sections
    accents: {
      blue: '#3B82F6',
      purple: '#A855F7',
      indigo: '#6366F1',
      cyan: '#06B6D4',
      green: '#22C55E',
    },

    // Background layers
    bg: {
      base: 'rgba(17, 24, 39, 0.5)',
      elevated: 'rgba(31, 41, 55, 0.6)',
      card: 'rgba(17, 24, 39, 0.5)',
    },

    // Borders
    border: {
      default: 'rgba(31, 41, 55, 0.8)',
      light: 'rgba(55, 65, 81, 0.6)',
      accent: (color: string) => `${color}40`,
    },
  },

  // Typography
  typography: {
    h1: {
      fontSize: '60px',
      fontWeight: '700',
      lineHeight: '1.1',
    },
    h2: {
      fontSize: '36px',
      fontWeight: '700',
      lineHeight: '1.2',
    },
    h3: {
      fontSize: '24px',
      fontWeight: '700',
      lineHeight: '1.3',
    },
    body: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    small: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.4',
    },
  },

  // Effects
  effects: {
    glow: (color: string) => `0 0 20px ${color}80, 0 0 40px ${color}40`,
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    },
  },
};

// Helper function to create consistent card styles
export const createCardStyle = (accentColor?: string) => ({
  borderRadius: DESIGN_TOKENS.card.borderRadius,
  padding: DESIGN_TOKENS.card.padding,
  border: accentColor 
    ? `1px solid ${accentColor}40`
    : DESIGN_TOKENS.card.border,
  background: DESIGN_TOKENS.card.background,
  backdropFilter: DESIGN_TOKENS.card.backdropFilter,
  boxShadow: DESIGN_TOKENS.card.boxShadow,
});

// Helper for section headers
export const createSectionHeaderStyle = (accentColor: string) => ({
  fontSize: DESIGN_TOKENS.sectionHeader.fontSize,
  fontWeight: DESIGN_TOKENS.sectionHeader.fontWeight,
  marginBottom: DESIGN_TOKENS.sectionHeader.marginBottom,
  paddingBottom: DESIGN_TOKENS.sectionHeader.paddingBottom,
  borderBottom: `2px solid ${accentColor}`,
});

