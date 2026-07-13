import { useEffect, useState } from 'react';

// מחזיר ערך מעוכב כדי לא להציף קריאות בזמן הקלדה.
export const useDebounce = <T>(value: T, delayMs = 250): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
