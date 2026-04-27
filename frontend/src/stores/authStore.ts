import { create } from 'zustand';
import { authApi } from '@/api/client';

interface AuthState {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

function decodeUserId(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

const storedToken = localStorage.getItem('token');

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  userId: storedToken ? decodeUserId(storedToken) : null,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email, password);
      const { accessToken } = res.data;
      localStorage.setItem('token', accessToken);
      set({ token: accessToken, userId: decodeUserId(accessToken), isAuthenticated: true, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(name, email, password);
      const { accessToken } = res.data;
      localStorage.setItem('token', accessToken);
      set({ token: accessToken, userId: decodeUserId(accessToken), isAuthenticated: true, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, userId: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
