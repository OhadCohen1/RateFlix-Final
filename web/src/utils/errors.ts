/**
 * Extracts a human-readable message from an API error.
 * The fetch client (services/api.ts) throws Error objects that already
 * carry the server's { error } message from the response envelope.
 */
export const getApiErrorMessage = (error: unknown, fallback = 'אירעה שגיאה, נסו שוב'): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
