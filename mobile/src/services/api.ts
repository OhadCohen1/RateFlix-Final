import Constants from 'expo-constants';
import type { ApiEnvelope } from './types';

// מזהה כתובת שרת לפי סביבת הרצה.
const resolveHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];
  return 'localhost';
};

export const API_BASE_URL = `http://${resolveHost()}:5050/api`;

// נשמר בזיכרון, נטען מ-AsyncStorage באתחול.
let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

const REQUEST_TIMEOUT_MS = 15000;
const NETWORK_ERROR_MESSAGE = 'השרת אינו זמין - ודאו שהוא רץ ושאתם באותה רשת';

/** פרמטרים ל-query string; ערכים ריקים לא נשלחים */
export type QueryParams = Record<string, string | undefined>;

const buildUrl = (path: string, params?: QueryParams): string => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  const qs = query.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
};

/** עטיפה דקה ל-fetch עם token ושגיאות אחידות */
const request = async <T>(
  method: string,
  path: string,
  options: { params?: QueryParams; body?: unknown } = {}
): Promise<T> => {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  } finally {
    clearTimeout(timer);
  }

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json?.success) {
    const message = json && typeof json.error === 'string' && json.error ? json.error : null;
    throw new Error(message ?? 'אירעה שגיאה, נסו שוב');
  }

  return json.data;
};

const api = {
  get: <T>(path: string, params?: QueryParams): Promise<T> => request<T>('GET', path, { params }),
  post: <T = unknown>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, { body }),
  put: <T = unknown>(path: string, body?: unknown): Promise<T> => request<T>('PUT', path, { body }),
  delete: <T = unknown>(path: string): Promise<T> => request<T>('DELETE', path),
};

// מחלץ הודעת שגיאה נוחה להצגה למשתמש.
export const getApiErrorMessage = (error: unknown, fallback = 'אירעה שגיאה, נסו שוב'): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export default api;
