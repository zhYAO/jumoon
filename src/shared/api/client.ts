import { message } from 'antd';
import { request } from '@umijs/max';
import { localeHeaders, t } from '@/i18n';
import { AUTH_FREE_URLS, redirectToLogin, refreshAccessToken } from './authSession';
import type { ApiResult } from './types';

/** 后端未登录/令牌失效：HTTP 200 + code 401 */
const UNAUTHORIZED_CODE = 401;

export class ApiError extends Error {
  code: number;
  constructor(msg: string, code: number) {
    super(msg);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** MFSU 可能打出多份模块，不能只靠 instanceof */
export function isApiError(e: unknown): e is ApiError {
  return Boolean(e && typeof e === 'object' && (e as { name?: string }).name === 'ApiError');
}

type RequestOptions = Record<string, any> & {
  /** 背景请求失败时不弹提示（由调用方自己处理） */
  skipErrorToast?: boolean;
};

type Attempt<T> = { res?: ApiResult<T>; unauthorized: boolean };

async function call<T>(url: string, options?: Record<string, any>) {
  const headers = { ...localeHeaders(), ...(options?.headers || {}) };
  return request<ApiResult<T>>(url, { ...options, headers, skipErrorHandler: true });
}

function fail<T>(res: ApiResult<T> | undefined, skipToast?: boolean): never {
  const code = typeof res?.code === 'number' ? res.code : -1;
  const msg = res?.msg || (res && typeof res.code === 'number' ? t('common.requestFailed') : t('common.responseInvalid'));
  const err = new ApiError(msg, code);
  if (!skipToast && code !== UNAUTHORIZED_CODE) {
    message.error(msg);
  }
  throw err;
}

function unwrap<T>(res: ApiResult<T> | undefined, skipToast?: boolean): T {
  if (!res || typeof res.code !== 'number' || res.code !== 0) {
    fail(res, skipToast);
  }
  return res.data as T;
}

async function attempt<T>(
  url: string,
  options?: Record<string, any>,
  skipToast?: boolean,
): Promise<Attempt<T>> {
  try {
    const res = await call<T>(url, options);
    return { res, unauthorized: res?.code === UNAUTHORIZED_CODE };
  } catch (e: any) {
    if (e?.response?.status === UNAUTHORIZED_CODE) {
      return { unauthorized: true };
    }
    if (isApiError(e)) throw e;
    const msg = e?.response?.data?.msg || e?.message || t('common.networkError');
    return fail(
      { code: typeof e?.response?.status === 'number' ? e.response.status : -1, data: null, msg } as ApiResult<T>,
      skipToast,
    );
  }
}

/**
 * 调用后端并解包 { code, data, msg }。
 * 令牌过期时静默续期并重试一次；续期或重试仍失败才回登录页。
 */
export async function apiRequest<T>(url: string, options?: RequestOptions): Promise<T> {
  const { skipErrorToast, ...rest } = options || {};
  const first = await attempt<T>(url, rest, skipErrorToast);
  if (!first.unauthorized) {
    return unwrap<T>(first.res, skipErrorToast);
  }

  const canRetry = !AUTH_FREE_URLS.includes(url);
  if (canRetry && (await refreshAccessToken())) {
    const retry = await attempt<T>(url, rest, skipErrorToast);
    if (!retry.unauthorized) {
      return unwrap<T>(retry.res, skipErrorToast);
    }
  }

  const reason = first.res?.msg || t('auth.sessionExpired');
  redirectToLogin(reason);
  throw new ApiError(reason, UNAUTHORIZED_CODE);
}

function bindUnhandledRejectionGuard() {
  const w = typeof window === 'undefined' ? undefined : (window as any);
  if (!w?.addEventListener) return;
  const handler = (event: PromiseRejectionEvent) => {
    if (!isApiError(event.reason)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  if (w.__jumoonApiErrorHandler) {
    w.removeEventListener('unhandledrejection', w.__jumoonApiErrorHandler, true);
    w.removeEventListener('unhandledrejection', w.__jumoonApiErrorHandler);
  }
  w.__jumoonApiErrorHandler = handler;
  w.addEventListener('unhandledrejection', handler, true);
}

bindUnhandledRejectionGuard();
