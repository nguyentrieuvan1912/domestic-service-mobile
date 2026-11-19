import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BrandColors } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export type BackgroundPresetId = 'mint' | 'slate' | 'ocean' | 'lavender' | 'sunset' | 'rose';

export interface BackgroundPreset {
  id: BackgroundPresetId;
  label: string;
  swatch: string;
  lightGradient: readonly [string, string];
  darkGradient: readonly [string, string];
}

export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  {
    id: 'mint',
    label: 'Xanh ngọc',
    swatch: '#10B981',
    lightGradient: ['#C0DCD0', '#E0ECE6'],
    darkGradient: ['#12352B', '#091815'],
  },
  {
    id: 'slate',
    label: 'Tinh tế',
    swatch: '#64748B',
    lightGradient: ['#D7E1EC', '#EEF3F8'],
    darkGradient: ['#26354B', '#0F172A'],
  },
  {
    id: 'ocean',
    label: 'Xanh biển',
    swatch: '#0EA5E9',
    lightGradient: ['#C5DDF4', '#E8F3FD'],
    darkGradient: ['#153753', '#0A1929'],
  },
  {
    id: 'lavender',
    label: 'Oải hương',
    swatch: '#8B5CF6',
    lightGradient: ['#DDD0F2', '#F0EAFA'],
    darkGradient: ['#302449', '#151126'],
  },
  {
    id: 'sunset',
    label: 'Kem ấm',
    swatch: '#F97316',
    lightGradient: ['#F2D9C6', '#FBEEE4'],
    darkGradient: ['#3A2720', '#1D1412'],
  },
  {
    id: 'rose',
    label: 'Hồng phấn',
    swatch: '#EC4899',
    lightGradient: ['#EDCEDD', '#FAEBF2'],
    darkGradient: ['#3B2134', '#1E111A'],
  },
] as const;

export interface AppThemeColors {
  isDark: boolean;
  background: string;
  backgroundGradient: BackgroundPreset['lightGradient'];
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  divider: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  tabBarBg: string;
  tabBarBorder: string;
  primary: string;
  primaryDark: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  bgPreset: BackgroundPresetId;
  preset: BackgroundPreset;
  isDark: boolean;
  colors: AppThemeColors;
  setMode: (mode: ThemeMode) => void;
  setBgPreset: (preset: BackgroundPresetId) => void;
  resetAppearance: () => void;
}

const STORAGE_KEY = 'cleanmaster_appearance_v1';
const DEFAULT_MODE: ThemeMode = 'light';
const DEFAULT_PRESET: BackgroundPresetId = 'mint';

async function readStorage(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeStorage(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    /* ignore storage errors */
  }
}

function isValidMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isValidPreset(value: unknown): value is BackgroundPresetId {
  return BACKGROUND_PRESETS.some(item => item.id === value);
}

function buildColors(isDark: boolean, preset: BackgroundPreset): AppThemeColors {
  const backgroundGradient = isDark ? preset.darkGradient : preset.lightGradient;
  const background = backgroundGradient[1];
  if (isDark) {
    return {
      isDark: true,
      background,
      backgroundGradient,
      surface: '#1E293B',
      surfaceElevated: '#273449',
      surfaceMuted: '#334155',
      border: '#334155',
      divider: '#293548',
      text: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      tabBarBg: '#0F172A',
      tabBarBorder: '#1E293B',
      primary: BrandColors.primary,
      primaryDark: '#059669',
      accentBg: '#064E3B',
      accentBorder: '#047857',
      accentText: '#6EE7B7',
      dangerBg: '#3F1519',
      dangerBorder: '#7F1D1D',
      dangerText: '#FCA5A5',
      warningBg: '#422006',
      warningBorder: '#92400E',
      warningText: '#FCD34D',
      infoBg: '#0C2A42',
      infoBorder: '#0369A1',
      infoText: '#7DD3FC',
    };
  }
  return {
    isDark: false,
    background,
    backgroundGradient,
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFC',
    surfaceMuted: '#F1F5F9',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    text: BrandColors.gray900,
    textSecondary: BrandColors.gray600,
    textMuted: BrandColors.gray500,
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    primary: BrandColors.primary,
    primaryDark: '#047857',
    accentBg: '#ECFDF5',
    accentBorder: '#A7F3D0',
    accentText: '#047857',
    dangerBg: '#FEF2F2',
    dangerBorder: '#FECACA',
    dangerText: '#DC2626',
    warningBg: '#FEF3C7',
    warningBorder: '#FDE68A',
    warningText: '#B45309',
    infoBg: '#F0F9FF',
    infoBorder: '#BAE6FD',
    infoText: '#075985',
  };
}

const defaultPreset = BACKGROUND_PRESETS[0];
const defaultValue: ThemeContextValue = {
  mode: DEFAULT_MODE,
  bgPreset: DEFAULT_PRESET,
  preset: defaultPreset,
  isDark: false,
  colors: buildColors(false, defaultPreset),
  setMode: () => undefined,
  setBgPreset: () => undefined,
  resetAppearance: () => undefined,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [bgPreset, setBgPresetState] = useState<BackgroundPresetId>(DEFAULT_PRESET);

  useEffect(() => {
    let active = true;
    void readStorage(STORAGE_KEY).then(raw => {
      if (!active || !raw) return;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (isValidMode(parsed.mode)) setModeState(parsed.mode);
        if (isValidPreset(parsed.bgPreset)) setBgPresetState(parsed.bgPreset);
      } catch {
        /* ignore invalid payload */
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((nextMode: ThemeMode, nextPreset: BackgroundPresetId) => {
    void writeStorage(STORAGE_KEY, JSON.stringify({ mode: nextMode, bgPreset: nextPreset }));
  }, []);

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      persist(nextMode, bgPreset);
    },
    [bgPreset, persist],
  );

  const setBgPreset = useCallback(
    (nextPreset: BackgroundPresetId) => {
      setBgPresetState(nextPreset);
      persist(mode, nextPreset);
    },
    [mode, persist],
  );

  const resetAppearance = useCallback(() => {
    setModeState(DEFAULT_MODE);
    setBgPresetState(DEFAULT_PRESET);
    persist(DEFAULT_MODE, DEFAULT_PRESET);
  }, [persist]);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const preset = useMemo(
    () => BACKGROUND_PRESETS.find(item => item.id === bgPreset) ?? defaultPreset,
    [bgPreset],
  );
  const colors = useMemo(() => buildColors(isDark, preset), [isDark, preset]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, bgPreset, preset, isDark, colors, setMode, setBgPreset, resetAppearance }),
    [mode, bgPreset, preset, isDark, colors, setMode, setBgPreset, resetAppearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function themeModeLabel(mode: ThemeMode): string {
  if (mode === 'dark') return 'Tối';
  if (mode === 'system') return 'Theo hệ thống';
  return 'Sáng';
}
