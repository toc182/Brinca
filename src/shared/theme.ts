/**
 * Brinca design tokens — single source of truth.
 * Based on docs/brand-decisions.md. Light mode only for V1.
 *
 * Font families reference the loaded Google Fonts names.
 * Components import tokens from here — never hardcode values.
 */

// ---------------------------------------------------------------------------
// Colors — Playful Purple palette (brand-decisions.md §3)
// ---------------------------------------------------------------------------

export const colors = {
  // Primary — brand purple
  primary500: '#6D4AE0',
  primary700: '#4F33B3',
  primary100: '#E3DBFF',
  primary50: '#F2EEFF',

  // Secondary — mint
  secondary500: '#14B8A6',
  secondary50: '#E6FAF6',

  // Accent — celebration orange
  accent500: '#FF8A3D',
  accent400: '#FFA366',
  accent600: '#E5701F',
  accent50: '#FFF1E6',

  // Backgrounds
  background: '#FAF8FF',
  surface: '#FFFFFF',
  surfaceDisabled: '#F4F3F8',

  // Error
  error500: '#E11D48',
  error600: '#C01A3F',
  error700: '#9F1239',
  error50: '#FFE4EA',

  // Success
  success500: '#059669',
  success600: '#047857',
  success700: '#065F46',
  success50: '#D1FAE5',

  // Warning
  warning500: '#D97706',
  warning700: '#92400E',
  warning50: '#FEF3C7',

  // Info
  info500: '#0284C7',
  info700: '#075985',
  info50: '#E0F2FE',

  // Text
  textPrimary: '#1A1630',
  textSecondary: '#4B4865',
  textPlaceholder: '#8B88A3',
  textDisabled: '#A7A4BD',
  textOnPrimary: '#FFFFFF',

  // Borders
  borderDefault: '#CCC9DB',
  borderSubtle: '#E8E5F2',

  // Overlay
  scrim: 'rgba(15, 11, 31, 0.4)',

  // Skeleton shimmer
  shimmerBase: '#E8E5F2',
  shimmerHighlight: '#F4F2FA',
} as const;

// ---------------------------------------------------------------------------
// Typography — brand-decisions.md §4
// ---------------------------------------------------------------------------

export const fontFamilies = {
  display: 'Fredoka_600SemiBold',
  body: 'Lexend_400Regular',
  bodyMedium: 'Lexend_500Medium',
  bodySemiBold: 'Lexend_600SemiBold',
  bodyBold: 'Lexend_700Bold',
  timer: 'JetBrainsMono_500Medium',
} as const;

export const typography = {
  titleLarge: {
    fontFamily: fontFamilies.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  titleMedium: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  titleSmall: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  captionSmall: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  buttonLarge: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  buttonSmall: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  counter: {
    fontFamily: fontFamilies.display,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  timer: {
    fontFamily: fontFamilies.timer,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 0,
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing — 4/8pt grid (brand-decisions.md §6)
// ---------------------------------------------------------------------------

export const spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ---------------------------------------------------------------------------
// Border radius (brand-decisions.md §6)
// ---------------------------------------------------------------------------

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadows — warm-tinted (brand-decisions.md §6)
// ---------------------------------------------------------------------------

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;

// ---------------------------------------------------------------------------
// Touch targets (brand-decisions.md §6)
// ---------------------------------------------------------------------------

export const touchTargets = {
  min: 44,
  adult: 48,
  kid: 56,
  kidLarge: 64,
} as const;

// ---------------------------------------------------------------------------
// Animation configs — Reanimated spring/timing (brand-decisions.md §6)
// ---------------------------------------------------------------------------

export const animations = {
  modalSlideUp: { mass: 1, stiffness: 180, damping: 20 },
  sheetOpen: { mass: 1, stiffness: 200, damping: 22 },
  sheetClose: { mass: 1, stiffness: 160, damping: 26 },
  toastEnter: { mass: 0.8, stiffness: 220, damping: 18 },
  toastExitMs: 200,
  buttonPress: { durationMs: 80, scale: 0.96 },
  buttonReleaseAdult: { mass: 0.6, stiffness: 300, damping: 22 },
  buttonReleaseKid: { mass: 0.6, stiffness: 300, damping: 15 },
  counterBounce: { mass: 1, stiffness: 140, damping: 8 },
  checkmarkDrawMs: 350,
  tabIconActive: { mass: 0.8, stiffness: 200, damping: 15, scale: 1.1 },
  progressRingMs: 900,
  listItemStagger: {
    damping: 15,
    mass: 1,
    stiffness: 150,
    delayPerItemMs: 40,
  },
} as const;

// ---------------------------------------------------------------------------
// Icon sizes (brand-decisions.md §6 — Phosphor)
// ---------------------------------------------------------------------------

export const iconSizes = {
  inline: 16,
  body: 20,
  tabBar: 24,
  action: 32,
  hero: 48,
} as const;
