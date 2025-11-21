'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaPalette, FaCheck } from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { currentTheme, availableThemes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-surface-light)] transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaPalette className="text-[var(--theme-primary)]" />
        <span className="hidden sm:inline text-sm">Theme</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Theme menu */}
            <motion.div
              className="absolute right-0 mt-2 w-64 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg shadow-2xl z-50 overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-3 border-b border-[var(--theme-border)]">
                <h3 className="text-sm font-semibold text-[var(--theme-text)]">Choose Theme</h3>
              </div>
              
              <div className="p-2 max-h-80 overflow-y-auto">
                {availableThemes.map((theme) => (
                  <motion.button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-[var(--theme-surface-light)] transition-colors group"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Theme color preview */}
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-[var(--theme-border)]"
                        style={{
                          background: theme.gradients.primary,
                        }}
                      />
                      
                      <div className="text-left">
                        <p className="text-sm font-medium text-[var(--theme-text)]">{theme.name}</p>
                        <p className="text-xs text-[var(--theme-text-muted)]">{theme.colors.primary}</p>
                      </div>
                    </div>

                    {currentTheme === theme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <FaCheck className="text-[var(--theme-primary)]" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

