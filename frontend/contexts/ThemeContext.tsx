'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes, defaultTheme, getTheme, generateThemeCSS } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: string;
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const theme = getTheme(currentTheme);
  const availableThemes = Object.values(themes);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Apply theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = generateThemeCSS(theme);
    
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  const handleSetTheme = (themeId: string) => {
    if (themes[themeId]) {
      setCurrentTheme(themeId);
      localStorage.setItem('app-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme,
        setTheme: handleSetTheme,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

