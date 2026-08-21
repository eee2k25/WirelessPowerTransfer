export type ThemeMode = 'dark' | 'day';

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  card: string;
  cardAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textDim: string;
  cyan: string;
  cyanDim: string;
  amber: string;
  amberDim: string;
  blue: string;
  blueDim: string;
  green: string;
  greenDim: string;
  red: string;
  redDim: string;
  orange: string;
  orangeDim: string;
  purple: string;
  white: string;
  onAccent: string;
  splash: readonly [string, string, string];
}

export const darkColors: ThemeColors = {
  bg: '#070B14',
  bgElevated: '#0C1220',
  card: '#111827',
  cardAlt: '#0F172A',
  border: '#1E293B',
  borderStrong: '#334155',
  text: '#E8EEF7',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  cyan: '#00E5C3',
  cyanDim: 'rgba(0,229,195,0.14)',
  amber: '#F5B942',
  amberDim: 'rgba(245,185,66,0.14)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.14)',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.14)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.16)',
  orange: '#F59E0B',
  orangeDim: 'rgba(245,158,11,0.14)',
  purple: '#A78BFA',
  white: '#FFFFFF',
  onAccent: '#071018',
  splash: ['#050814', '#0B1C2C', '#06251F'],
};

export const dayColors: ThemeColors = {
  bg: '#FBF3E2',
  bgElevated: '#FFFDF6',
  card: '#FFFDF6',
  cardAlt: '#F5E8CE',
  border: '#E0C98F',
  borderStrong: '#C7A24A',
  text: '#3B1512',
  textMuted: '#7B4A2E',
  textDim: '#A06B3B',
  cyan: '#B3121B',
  cyanDim: 'rgba(179,18,27,0.12)',
  amber: '#A87A12',
  amberDim: 'rgba(168,122,18,0.14)',
  blue: '#B8621B',
  blueDim: 'rgba(184,98,27,0.12)',
  green: '#5C7A1D',
  greenDim: 'rgba(92,122,29,0.12)',
  red: '#8C0F14',
  redDim: 'rgba(140,15,20,0.14)',
  orange: '#C28B16',
  orangeDim: 'rgba(194,139,22,0.14)',
  purple: '#8A5BA8',
  white: '#FFFFFF',
  onAccent: '#FFFDF6',
  splash: ['#FBF3E2', '#F3DFB4', '#EBC98D'],
};

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: darkColors,
  day: dayColors,
};

export function themeFor(mode: ThemeMode | null | undefined) {
  return themes[mode === 'day' ? 'day' : 'dark'];
}

export const THEME_OPTIONS: ReadonlyArray<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: 'moon' | 'sunny';
  swatches: readonly [string, string, string];
}> = [
  {
    value: 'dark',
    label: 'Dark',
    description: 'Original navy control-panel theme with cyan and amber accents.',
    icon: 'moon',
    swatches: [darkColors.bg, darkColors.cyan, darkColors.amber],
  },
  {
    value: 'day',
    label: 'Day',
    description: 'Warm cream interface with deep red primary and gold secondary accents.',
    icon: 'sunny',
    swatches: [dayColors.bg, dayColors.cyan, dayColors.amber],
  },
];

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};
