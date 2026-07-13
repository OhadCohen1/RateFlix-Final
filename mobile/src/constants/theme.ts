/**
 * RateFlix mobile theme - dark, red-led palette matching the web app
 * (Netflix-style: near-black surfaces, brand-red actions, amber stars).
 * Surface values mirror the web design tokens in web/src/index.css.
 */
export const colors = {
  primary: '#E50914', // brand red (web --color-brand-500)
  primaryDark: '#F6323D', // readable red for text over primarySoft (web brand-400)
  primarySoft: '#2A1215', // dark red tint for soft backgrounds
  accent: '#F59E0B', // recommendations highlight (amber)
  accentSoft: '#2B2010',
  bg: '#0A0A0C', // web surface-950
  card: '#131318', // web surface-900
  border: '#2B2B36', // web surface-700
  text: '#F4F4F5',
  textMuted: '#A1A1AA',
  textFaint: '#71717A',
  textDark: '#1A1A1E', // text over light badges (e.g. the yellow admin badge)
  star: '#FBBF24',
  starEmpty: '#3F3F46',
  danger: '#F6323D',
  success: '#34D399',
  successSoft: '#0F2A20',
  badge: '#F7D154',
  white: '#FFFFFF',
} as const;

export const MAX_STARS = 5;
