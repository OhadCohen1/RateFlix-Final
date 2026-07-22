import type { ApiEnvelope } from '../types/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api';

export const TOKEN_STORAGE_KEY = 'rateflix_token';
export const USER_STORAGE_KEY = 'rateflix_user';

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

/** עטיפה דקה ל-fetch עם token וטיפול שגיאות אחיד */
const request = async <T>(
  method: string,
  path: string,
  options: { params?: QueryParams; body?: unknown } = {}
): Promise<T> => {
  const headers: Record<string, string> = {};

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  // ב-FormData הדפדפן קובע Content-Type לבד.
  const isForm = options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body: isForm
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch {
    throw new Error('השרת אינו זמין - בדקו שהוא רץ');
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

export default api;
