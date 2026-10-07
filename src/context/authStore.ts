import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearError: () => void;
}

const decodeJwtPayload = (token: string): any => {
  const payload = token.split('.')[1];
  if (!payload) return null;

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const decoded = atob(padded);
  return JSON.parse(decoded);
};

const getInitialUser = (): User | null => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const payload = decodeJwtPayload(token);
    return {
      id: payload?.sub,
      email: payload?.email,
      role: payload?.role,
    };
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: getInitialUser(),
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { authAPI } = await import('../api/auth');
      const response = await authAPI.login({ email, password });

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Decode token to get user info
      const payload = decodeJwtPayload(access_token);
      const user: User = {
        id: payload?.sub,
        email: payload?.email,
        role: payload?.role,
      };

      set({
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      // Extract the most specific error message available
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          'Login failed. Please try again.';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },
  
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },
  
  setUser: (user: User) => {
    set({ user });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
