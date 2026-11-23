import { apiRequest } from '@/shared/api/client';
import type { LoginPayload, PermissionInfo, TokenPayload } from '../types';

const BASE = '/admin-api/system/auth';

export const authService = {
  login(data: LoginPayload) {
    return apiRequest<TokenPayload>(`${BASE}/login`, { method: 'POST', data });
  },
  logout(refreshToken?: string) {
    return apiRequest<boolean>(`${BASE}/logout`, {
      method: 'POST',
      data: refreshToken ? { refreshToken } : {},
    });
  },
  refreshToken(refreshToken: string) {
    return apiRequest<TokenPayload>(`${BASE}/refresh-token`, {
      method: 'POST',
      data: { refreshToken },
    });
  },
  getPermissionInfo() {
    return apiRequest<PermissionInfo>(`${BASE}/get-permission-info`, { method: 'GET' });
  },
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return apiRequest<TokenPayload>(`${BASE}/change-password`, { method: 'POST', data });
  },
};
