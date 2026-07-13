import { useEffect, useState } from 'react';

/**
 * Returns a value that only updates after it stopped changing for `delayMs`.
 * Used to avoid firing a network request on every keystroke while typing.
 */
export const useDebounce = <T>(value: T, delayMs = 250): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
