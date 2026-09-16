import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemePillToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemePillToggle: React.FC<ThemePillToggleProps> = ({
  className = '',
  showLabels = true,
}) => {
  const { setTheme, isDark } = useTheme();

  return (
    <div
      id="theme-pill-toggle"
      role="radiogroup"
      aria-label="Sélecteur de mode Deep Amethyst ou Clair Pastel"
      className={`relative inline-flex items-center p-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] shadow-xs transition-colors duration-200 select-none ${className}`}
    >
      {/* Option Mode Clair Pastel Doux */}
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        id="theme-pill-light-btn"
        onClick={() => setTheme('light')}
        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer active:scale-95 ${
          !isDark
            ? 'text-[#6C5CE7]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title="Activer le mode clair pastel doux"
      >
        {!isDark && (
          <motion.div
            layoutId="activeThemePill"
            className="absolute inset-0 rounded-full bg-white shadow-xs border border-[#E5E4F3]"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <Sun className={`w-3.5 h-3.5 transition-transform duration-300 ${!isDark ? 'rotate-0 text-[#F59E0B]' : 'text-[var(--text-muted)]'}`} />
          {showLabels && (
            <span className="hidden sm:inline text-[11px] font-medium tracking-tight">
              Pastel
            </span>
          )}
        </span>
      </button>

      {/* Option Mode Sombre Deep Amethyst */}
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        id="theme-pill-dark-btn"
        onClick={() => setTheme('dark')}
        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer active:scale-95 ${
          isDark
            ? 'text-white'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title="Activer le mode sombre Deep Amethyst & Glow néon"
      >
        {isDark && (
          <motion.div
            layoutId="activeThemePill"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] shadow-[0_0_16px_rgba(138,43,226,0.5)]"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <div className="relative flex items-center justify-center">
            <Moon className={`w-3.5 h-3.5 transition-transform duration-300 ${isDark ? '-rotate-12 text-[#E9D5FF]' : 'text-[var(--text-muted)]'}`} />
            {isDark && (
              <Sparkles className="w-2 h-2 text-[#F0ABFC] absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
          {showLabels && (
            <span className="hidden sm:inline text-[11px] font-medium tracking-tight">
              Améthyste
            </span>
          )}
        </span>
      </button>
    </div>
  );
};

