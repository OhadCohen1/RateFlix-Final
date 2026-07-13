import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { loginRequest, registerRequest } from '../services/rateflixApi';
import { setAuthToken } from '../services/api';

const TOKEN_KEY = 'rateflix_token';
const USER_KEY = 'rateflix_user';

interface AuthContextValue {
  user: User | null;
  /** true בזמן שחזור סשן שמור באתחול */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // משחזרים סשן שמור פעם אחת בתחילת האפליקציה.
  useEffect(() => {
    const restore = async () => {
      try {
        const [token, rawUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (token && rawUser) {
          setAuthToken(token);
          setUser(JSON.parse(rawUser) as User);
        }
      } catch {
        // אם האחסון שבור, מתחילים מנותקים.
      } finally {
        setInitializing(false);
      }
    };
    void restore();
  }, []);

  const persistSession = useCallback(async (nextUser: User, token: string) => {
    setAuthToken(token);
    setUser(nextUser);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginRequest(email, password);
      await persistSession(res.user, res.token);
    },
    [persistSession]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await registerRequest(email, password);
      await persistSession(res.user, res.token);
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
};
