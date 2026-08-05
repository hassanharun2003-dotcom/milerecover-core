import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, darkColors, type AppPalette } from '@milerecover/config';

export type { AppPalette };

type ThemeContextValue = {
  scheme: 'light' | 'dark';
  palette: AppPalette;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  palette: colors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const scheme: 'light' | 'dark' = system === 'dark' ? 'dark' : 'light';
  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      palette: scheme === 'dark' ? darkColors : colors,
      isDark: scheme === 'dark',
    }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
