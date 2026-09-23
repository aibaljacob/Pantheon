export type ThemeMode = 'system' | 'dark' | 'light';

export type ResolvedTheme = 'dark' | 'light';

export interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}
