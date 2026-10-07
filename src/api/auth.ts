import api from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authAPI = {
  login: (credentials: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', credentials),

  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', null, { params: { email } }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', null, { params: { token, new_password } }),
};
