import api from './api';
import type { AuthPayload } from '../types/api';

export const loginRequest = (email: string, password: string): Promise<AuthPayload> =>
  api.post<AuthPayload>('/auth/login', { email, password });

export const registerRequest = (email: string, password: string): Promise<AuthPayload> =>
  api.post<AuthPayload>('/auth/register', { email, password });
