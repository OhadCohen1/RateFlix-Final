import type { ApiEnvelope } from '../types/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const TOKEN_STORAGE_KEY = 'rateflix_token';
export const USER_STORAGE_KEY = 'rateflix_user';

/** Query-string params; undefined values are omitted */
export type QueryParams = Record<string, string | undefined>;

const buildUrl = (path: string, params?: QueryParams): string => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  const qs = query.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
};

/**
 * Thin fetch wrapper (native fetch, like the course client code):
 * appends the JWT Bearer token automatically, unwraps the
 * { success, data } envelope and throws an Error carrying the
 * server's { error } message on failure.
 */
const request = async <T>(
  method: string,
  path: string,
  options: { params?: QueryParams; body?: unknown } = {}
): Promise<T> => {
  const headers: Record<string, string> = {};

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  // For FormData the browser sets the multipart Content-Type (with boundary) itself
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
