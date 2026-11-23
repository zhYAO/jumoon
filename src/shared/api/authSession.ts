import { history } from '@umijs/max';
import { localeHeaders } from '@/i18n';
import {
  clearTokens,
  getRefreshToken,
  setLogoutReason,
  setTokens,
} from '@/shared/utils/storage';

const LOGIN_PATH = '/login';
const REFRESH_URL = '/admin-api/system/auth/refresh-token';

/** 不参与自动续期的接口，避免递归 */
export const AUTH_FREE_URLS = [REFRESH_URL, '/admin-api/system/auth/login'];

let refreshing: Promise<boolean> | null = null;

/**
 * 用 refreshToken 换新 access。并发只发一次请求，其余等待同一结果。
 * 这里用原生 fetch，绕开 umi request 拦截器，避免循环依赖。
 */
export function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...localeHeaders() },
        body: JSON.stringify({ refreshToken }),
      });
      const body = await res.json();
      if (body?.code !== 0 || !body?.data?.accessToken) return false;
      setTokens(body.data.accessToken, body.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

/**
 * 续期失败：清 token 并回登录页，带 redirect 便于登录后返回。
 * reason 会在登录页提示一次（例如「账号已在其它设备登录」）。
 */
export function redirectToLogin(reason?: string) {
  clearTokens();
  setLogoutReason(reason);
  const { pathname, search } = window.location;
  if (pathname === LOGIN_PATH) return;
  const redirect = encodeURIComponent(`${pathname}${search}`);
  history.replace(`${LOGIN_PATH}?redirect=${redirect}`);
}
