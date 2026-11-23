import { useCallback, useState } from 'react';
import { history } from '@umijs/max';
import { authService } from '../services/authService';
import type { LoginPayload, PermissionInfo } from '../types';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/shared/utils/storage';

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const tokens = await authService.login(payload);
      setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = getRefreshToken();
      if (getAccessToken()) {
        await authService.logout(refresh || undefined);
      }
    } catch {
      // ignore
    } finally {
      clearTokens();
      history.push('/login');
    }
  }, []);

  const fetchPermissionInfo = useCallback(async (): Promise<PermissionInfo | null> => {
    if (!getAccessToken()) return null;
    return authService.getPermissionInfo();
  }, []);

  return { loading, login, logout, fetchPermissionInfo };
}
