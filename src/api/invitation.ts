import api from './client';

export const invitationAPI = {
  verifyToken: (token: string) =>
    api.get(`/invitations/verify-token/${token}`),

  setPassword: (token: string, password: string) =>
    api.post('/invitations/set-password', { token, password }),
};
