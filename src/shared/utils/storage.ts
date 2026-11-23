import {
  LOGOUT_REASON_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
} from '@/shared/constants/storage';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setLogoutReason(reason?: string) {
  if (reason) {
    localStorage.setItem(LOGOUT_REASON_KEY, reason);
  }
}

/** 读取一次即清除，避免下次进入登录页重复提示 */
export function takeLogoutReason(): string | null {
  const reason = localStorage.getItem(LOGOUT_REASON_KEY);
  localStorage.removeItem(LOGOUT_REASON_KEY);
  return reason;
}
