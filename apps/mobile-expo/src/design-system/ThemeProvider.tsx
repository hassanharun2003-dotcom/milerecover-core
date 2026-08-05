import React, { createContext, useContext, useMemo } from 'react';
import { colors, type AppPalette } from '@milerecover/config';

export type { AppPalette };

type ThemeContextValue = {
  scheme: 'light';
  palette: AppPalette;
  isDark: false;
};

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  palette: colors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      // Dark mode is not a shipped customer path yet; force the polished light palette
      // so OS appearance cannot route users into the unfinished dark experience.
      scheme: 'light',
      palette: colors,
      isDark: false,
    }),
    [],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
