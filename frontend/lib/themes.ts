/**
 * Multi-theme system for Level 4 UI
 * Preset themes: Sui, Ocean, Sunset, Forest, Midnight
 */

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    background: string;
    surface: string;
    surfaceLight: string;
    border: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
  };
  gradients: {
    primary: string;
    primaryHover: string;
    glow: string;
    mesh: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
    glow: string;
  };
}

export const themes: Record<string, Theme> = {
  sui: {
    id: 'sui',
    name: 'Sui',
    colors: {
      primary: '#4DA2FF',
      primaryLight: '#6FBCFF',
      primaryDark: '#2563EB',
      secondary: '#06B6D4',
      secondaryLight: '#22D3EE',
      accent: '#14B8A6',
      background: '#0F1419',
      surface: '#1A1F2E',
      surfaceLight: '#1F2937',
      border: '#2A3441',
      text: '#E5E7EB',
      textMuted: '#9CA3AF',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #4DA2FF 0%, #6FBCFF 100%)',
      primaryHover: 'linear-gradient(135deg, #2563EB 0%, #4DA2FF 100%)',
      glow: 'radial-gradient(circle at center, rgba(77, 162, 255, 0.15) 0%, transparent 70%)',
      mesh: 'linear-gradient(135deg, #0F1419 0%, #1A1F2E 25%, rgba(77, 162, 255, 0.1) 50%, #1A1F2E 75%, #0F1419 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(77, 162, 255, 0.1)',
      medium: '0 4px 8px rgba(77, 162, 255, 0.15)',
      large: '0 8px 16px rgba(77, 162, 255, 0.2)',
      glow: '0 0 20px rgba(77, 162, 255, 0.4)',
    },
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      primary: '#0EA5E9',
      primaryLight: '#38BDF8',
      primaryDark: '#0284C7',
      secondary: '#06B6D4',
      secondaryLight: '#22D3EE',
      accent: '#3B82F6',
      background: '#0C1821',
      surface: '#1B2838',
      surfaceLight: '#243447',
      border: '#2D4A5E',
      text: '#E0F2FE',
      textMuted: '#94A3B8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
      primaryHover: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
      glow: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
      mesh: 'linear-gradient(135deg, #0C1821 0%, #1B2838 25%, rgba(14, 165, 233, 0.1) 50%, #1B2838 75%, #0C1821 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(14, 165, 233, 0.1)',
      medium: '0 4px 8px rgba(14, 165, 233, 0.15)',
      large: '0 8px 16px rgba(14, 165, 233, 0.2)',
      glow: '0 0 20px rgba(14, 165, 233, 0.4)',
    },
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      primary: '#F97316',
      primaryLight: '#FB923C',
      primaryDark: '#EA580C',
      secondary: '#EC4899',
      secondaryLight: '#F472B6',
      accent: '#A855F7',
      background: '#1C0F0A',
      surface: '#2D1810',
      surfaceLight: '#3D2318',
      border: '#4D3020',
      text: '#FEF3C7',
      textMuted: '#D1A27B',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)',
      primaryHover: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
      glow: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
      mesh: 'linear-gradient(135deg, #1C0F0A 0%, #2D1810 25%, rgba(249, 115, 22, 0.1) 50%, #2D1810 75%, #1C0F0A 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(249, 115, 22, 0.1)',
      medium: '0 4px 8px rgba(249, 115, 22, 0.15)',
      large: '0 8px 16px rgba(249, 115, 22, 0.2)',
      glow: '0 0 20px rgba(249, 115, 22, 0.4)',
    },
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#059669',
      secondary: '#14B8A6',
      secondaryLight: '#2DD4BF',
      accent: '#84CC16',
      background: '#0A1810',
      surface: '#132820',
      surfaceLight: '#1C3830',
      border: '#254838',
      text: '#DCFCE7',
      textMuted: '#86EFAC',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      primaryHover: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      glow: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
      mesh: 'linear-gradient(135deg, #0A1810 0%, #132820 25%, rgba(16, 185, 129, 0.1) 50%, #132820 75%, #0A1810 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(16, 185, 129, 0.1)',
      medium: '0 4px 8px rgba(16, 185, 129, 0.15)',
      large: '0 8px 16px rgba(16, 185, 129, 0.2)',
      glow: '0 0 20px rgba(16, 185, 129, 0.4)',
    },
  },

  midnight: {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      primary: '#8B5CF6',
      primaryLight: '#A78BFA',
      primaryDark: '#7C3AED',
      secondary: '#EC4899',
      secondaryLight: '#F472B6',
      accent: '#6366F1',
      background: '#0F0A1C',
      surface: '#1A1325',
      surfaceLight: '#251D35',
      border: '#352845',
      text: '#EDE9FE',
      textMuted: '#C4B5FD',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      primaryHover: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
      glow: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
      mesh: 'linear-gradient(135deg, #0F0A1C 0%, #1A1325 25%, rgba(139, 92, 246, 0.1) 50%, #1A1325 75%, #0F0A1C 100%)',
    },
    shadows: {
      small: '0 2px 4px rgba(139, 92, 246, 0.1)',
      medium: '0 4px 8px rgba(139, 92, 246, 0.15)',
      large: '0 8px 16px rgba(139, 92, 246, 0.2)',
      glow: '0 0 20px rgba(139, 92, 246, 0.4)',
    },
  },
};

export const defaultTheme = 'sui';

// Hook to get current theme
export function getTheme(themeId: string): Theme {
  return themes[themeId] || themes[defaultTheme];
}

// Generate CSS variables from theme
export function generateThemeCSS(theme: Theme): Record<string, string> {
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-primary-light': theme.colors.primaryLight,
    '--theme-primary-dark': theme.colors.primaryDark,
    '--theme-secondary': theme.colors.secondary,
    '--theme-secondary-light': theme.colors.secondaryLight,
    '--theme-accent': theme.colors.accent,
    '--theme-background': theme.colors.background,
    '--theme-surface': theme.colors.surface,
    '--theme-surface-light': theme.colors.surfaceLight,
    '--theme-border': theme.colors.border,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-success': theme.colors.success,
    '--theme-warning': theme.colors.warning,
    '--theme-error': theme.colors.error,
  };
}

