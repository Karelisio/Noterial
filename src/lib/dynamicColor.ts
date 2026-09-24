import { registerPlugin, Capacitor } from '@capacitor/core';

/** Roles read from the system's Material You palette (see DynamicColorPlugin.java). */
export interface DynamicPalette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
}

interface DynamicColorPlugin {
  getColors(): Promise<{ available: boolean; light?: DynamicPalette; dark?: DynamicPalette }>;
}

const DynamicColor = registerPlugin<DynamicColorPlugin>('DynamicColor');

/**
 * System Material You palette (Android 12+, extracted from the wallpaper by
 * Android itself), in both light and dark variants. `null` below Android 12
 * or off-Android — callers should fall back to a fixed palette.
 *
 * Ported from Orbit/Mago's DynamicColorPlugin so a future widget could read
 * the exact same values and never diverge from the app.
 */
export async function getSystemDynamicColors(): Promise<{ light: DynamicPalette; dark: DynamicPalette } | null> {
  if (Capacitor.getPlatform() !== 'android') return null;
  try {
    const { available, light, dark } = await DynamicColor.getColors();
    if (!available || !light || !dark) return null;
    return { light, dark };
  } catch {
    return null;
  }
}
