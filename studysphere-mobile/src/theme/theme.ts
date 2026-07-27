import { StyleSheet } from 'react-native';


export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  overlay: string;
}

export const LIGHT_COLORS: ThemeColors = {
  primary: '#2563EB',       // Royal Blue
  background: '#F1F5F9',    // Ice White
  surface: '#E2E8F0',       // Light Blue Gray
  text: '#1E293B',          // Dark Navy
  textSecondary: '#475569', // Slate-600
  border: '#CBD5E1',        // Slate-300
  error: '#EF4444',
  success: '#22C55E',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const DARK_COLORS: ThemeColors = {
  primary: '#3B82F6',       // Electric Blue (eski colors.ts dark.accent)
  background: '#0F172A',    // Midnight Navy (eski colors.ts dark.background)
  surface: '#1E293B',       // Steel Blue (eski colors.ts dark.card)
  text: '#F1F5F9',          // Ice White (eski colors.ts dark.text)
  textSecondary: '#94A3B8', // Slate-400 — koyu zeminde okunabilirlik için light moddakinden daha açık
  border: '#334155',        // Slate-700 — koyu yüzeyler için daha koyu kenarlık
  error: '#F87171',         // Red-400 — koyu zeminde daha az göz yoran kırmızı
  success: '#4ADE80',       // Green-400
  overlay: 'rgba(0, 0, 0, 0.65)',
};

export const PALETTES: Record<ThemeMode, ThemeColors> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export function createShadows(colors: ThemeColors) {
  return {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2, // Android desteği için mutlak zorunluluk
    },
    medium: {
      shadowColor: colors.primary, // FAB butonu gibi marka rengini vurgulayan gölge
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
  };
}

export type Shadows = ReturnType<typeof createShadows>;

export function createGlobalStyles(colors: ThemeColors) {
  const shadows = createShadows(colors);
  return StyleSheet.create({
    // Tam ekran konteyner yapısı
    screenContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      padding: SPACING.lg,
      borderRadius: 12,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.light,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: SPACING.md,
      fontSize: 16,
      color: colors.text,
      marginBottom: SPACING.md,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
}

export type GlobalStyles = ReturnType<typeof createGlobalStyles>;
