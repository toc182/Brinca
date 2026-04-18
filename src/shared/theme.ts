/**
 * v0 design tokens — functional starting point.
 * Will be replaced with brand tokens from brand-decisions.md in Phase 2.
 * Light mode only for V1.
 */

export const colors = {
  accent: '#007AFF',
  accentLight: '#E5F0FF',
  destructive: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',

  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textOnAccent: '#FFFFFF',

  background: '#FFFFFF',
  backgroundGrouped: '#F2F2F7',
  separator: '#C6C6C8',
  shimmer: '#E5E5EA',
} as const;

export const typography = {
  titleLarge: { fontSize: 34, fontWeight: '700' as const, lineHeight: 41 },
  titleMedium: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  titleSmall: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionSmall: { fontSize: 11, fontWeight: '400' as const, lineHeight: 13 },
  buttonLarge: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  buttonSmall: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  counter: { fontSize: 48, fontWeight: '700' as const, lineHeight: 56 },
  timer: { fontSize: 40, fontWeight: '500' as const, lineHeight: 48 },
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const touchTargetMin = 44;
