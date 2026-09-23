import React, { useState, useRef, useEffect } from 'react';
import { MoonStar, SunMedium, Monitor, Check } from 'lucide-react';
import { useThemeStore } from './themeStore';
import type { ThemeMode } from './types';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'segmented';
  className?: string;
}

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'dark',
    label: 'Cinematic Noir',
    subtitle: 'Warm graphite surfaces with soft atmospheric studio lighting',
    icon: MoonStar,
  },
  {
    mode: 'light',
    label: 'Cinematic Daylight',
    subtitle: 'Warm ivory, stone, and parchment with natural architectural lighting',
    icon: SunMedium,
  },
  {
    mode: 'system',
    label: 'System Preference',
    subtitle: 'Automatically synchronize with your operating system color scheme',
    icon: Monitor,
  },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  if (variant === 'segmented') {
    return (
      <div className={`grid gap-3 sm:grid-cols-3 ${className}`}>
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.mode;

          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => setTheme(option.mode)}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-pantheon-ivory/40 bg-pantheon-mid shadow-lg shadow-black/20 ring-1 ring-pantheon-ivory/20'
                  : 'border-pantheon-border-dark bg-pantheon-low hover:border-pantheon-border hover:bg-pantheon-mid'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      isSelected
                        ? 'border-pantheon-ivory/40 bg-pantheon-high text-pantheon-ivory'
                        : 'border-pantheon-border bg-pantheon-mid text-pantheon-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {isSelected ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pantheon-ivory text-pantheon-bg text-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-pantheon-border" />
                  )}
                </div>
                <div className="mt-3">
                  <p className="font-headline text-sm font-semibold text-pantheon-ivory">
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-pantheon-muted">
                    {option.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 pt-2 border-t border-pantheon-border-dark text-[11px] font-mono text-pantheon-dim">
                <span>Mode:</span>
                <span className="uppercase tracking-wider text-pantheon-muted">
                  {option.mode === 'system' ? `Auto (${resolvedTheme})` : option.mode}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant for navigation bars and headers
  const CurrentIcon = resolvedTheme === 'dark' ? MoonStar : SunMedium;
  const currentLabel =
    theme === 'system'
      ? 'System'
      : theme === 'dark'
      ? 'Noir'
      : 'Daylight';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-label="Select theme"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-pantheon-border-dark bg-pantheon-low px-3.5 text-sm text-pantheon-ivory transition-colors hover:border-pantheon-border hover:bg-pantheon-mid"
      >
        <CurrentIcon className="h-4 w-4 text-pantheon-ivory" />
        <span className="hidden sm:inline font-sans text-xs font-medium text-pantheon-muted">
          {currentLabel}
        </span>
      </button>

      {dropdownOpen && (
        <div
          role="menu"
          aria-label="Theme selection"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 rounded-2xl border border-pantheon-border bg-pantheon-low p-1.5 shadow-2xl shadow-black/40 backdrop-blur-md"
        >
          <div className="px-3 py-2 border-b border-pantheon-border-dark">
            <p className="text-[10px] font-mono uppercase tracking-wider text-pantheon-dim">
              Appearance
            </p>
            <p className="text-xs font-semibold text-pantheon-ivory">Workspace Theme</p>
          </div>

          <div className="mt-1 space-y-0.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.mode;

              return (
                <button
                  key={opt.mode}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setTheme(opt.mode);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-pantheon-high text-pantheon-ivory font-medium'
                      : 'text-pantheon-muted hover:bg-pantheon-mid hover:text-pantheon-ivory'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-pantheon-dim" />
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-pantheon-ivory" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
