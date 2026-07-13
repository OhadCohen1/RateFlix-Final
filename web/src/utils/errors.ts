// מחלץ הודעת שגיאה נוחה להצגה למשתמש.
export const getApiErrorMessage = (error: unknown, fallback = 'אירעה שגיאה, נסו שוב'): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
