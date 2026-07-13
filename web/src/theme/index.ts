/**
 * RateFlix theme tokens.
 * The same values are declared as Tailwind utilities in src/index.css (@theme);
 * this module exposes them to TypeScript for non-class usages (inline styles,
 * canvas, charts, etc.).
 */
export const colors = {
  brand: {
    400: '#f6323d',
    500: '#e50914',
    600: '#c00812',
  },
  surface: {
    950: '#0a0a0c',
    900: '#131318',
    800: '#1e1e26',
    700: '#2b2b36',
  },
} as const;

export const MAX_STARS = 5;
