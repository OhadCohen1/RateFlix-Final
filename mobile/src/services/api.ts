import Constants from 'expo-constants';
import type { ApiEnvelope } from './types';

/**
 * Resolves the API host automatically:
 * - On a physical phone running Expo Go, "localhost" would point at the phone
 *   itself, so we take the dev machine's LAN IP from the Metro host URI.
 * - On web / emulator it falls back to localhost.
 */
const resolveHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];
  return 'localhost';
};

export const API_BASE_URL = `http://${resolveHost()}:5000/api`;

// Kept in memory (loaded from AsyncStorage by the AuthContext on startup)
let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

const REQUEST_TIMEOUT_MS = 15000;
const NETWORK_ERROR_MESSAGE = 'השרת אינו זמין - ודאו שהוא רץ ושאתם באותה רשת';

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

/**
 * Extracts a human-readable message from an API error.
 * The fetch client above throws Error objects that already carry the
 * server's { error } message from the response envelope.
 */
export const getApiErrorMessage = (error: unknown, fallback = 'אירעה שגיאה, נסו שוב'): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export default api;
