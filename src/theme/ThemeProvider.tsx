import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Preferences } from '@capacitor/preferences';
import { getSystemDynamicColors, type DynamicPalette } from '@/lib/dynamicColor';

export type ThemeMode = 'light' | 'dark' | 'auto';
const THEME_KEY = 'theme_mode';

const FALLBACK_PRIMARY = '#6750A4';
const FALLBACK_SECONDARY = '#625B71';

interface ThemeCtx {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function useThemeMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [systemDark, setSystemDark] = useState(systemPrefersDark());
  const [dynamicColors, setDynamicColors] = useState<{ light: DynamicPalette; dark: DynamicPalette } | null>(null);

  useEffect(() => {
    Preferences.get({ key: THEME_KEY }).then(({ value }) => {
      if (value === 'light' || value === 'dark' || value === 'auto') setModeState(value);
    });
    getSystemDynamicColors().then(setDynamicColors);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    Preferences.set({ key: THEME_KEY, value: m });
  };

  const resolved = mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode;

  const theme = useMemo(() => {
    const palette = dynamicColors?.[resolved];
    return createTheme({
      palette: {
        mode: resolved,
        primary: {
          main: palette?.primary ?? FALLBACK_PRIMARY,
          contrastText: palette?.onPrimary,
        },
        secondary: {
          main: palette?.secondary ?? FALLBACK_SECONDARY,
          contrastText: palette?.onSecondary,
        },
        ...(palette && {
          background: { default: palette.background, paper: palette.surface },
          text: { primary: palette.onSurface, secondary: palette.onSurfaceVariant },
          divider: palette.outline,
        }),
      },
      shape: { borderRadius: 16 },
    });
  }, [resolved, dynamicColors]);

  return (
    <Ctx.Provider value={{ mode, resolved, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </Ctx.Provider>
  );
}
