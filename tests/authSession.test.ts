/**
 * 登录会话的关键行为：静默续期、并发合并、失败回登录页。
 * 这里连着真实的 authSession 一起测，只替换 umi 的 request/history 与全局 fetch。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
const historyReplace = vi.fn();

vi.mock('@umijs/max', () => ({
  request: (...args: any[]) => request(...args),
  history: { replace: (...args: any[]) => historyReplace(...args) },
  getLocale: () => 'zh-CN',
  setLocale: () => undefined,
  getIntl: () => ({
    formatMessage: ({ id }: { id: string }) =>
      (
        {
          'common.requestFailed': '请求失败',
          'common.responseInvalid': '接口响应异常',
          'common.networkError': '网络异常',
          'auth.sessionExpired': '登录已过期，请重新登录',
        } as Record<string, string>
      )[id] || id,
  }),
}));

vi.mock('antd', () => ({
  message: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

import { apiRequest, isApiError } from '@/shared/api/client';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/shared/constants/storage';
import { getAccessToken, setTokens, takeLogoutReason } from '@/shared/utils/storage';

const URL = '/admin-api/system/user/page';
const LOGIN_URL = '/admin-api/system/auth/login';

const okBody = (data: any) => ({ code: 0, data, msg: '' });
const errBody = (code: number, msg: string) => ({ code, data: null, msg });

function mockRefreshResponse(body: any, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  request.mockReset();
  historyReplace.mockReset();
  setTokens('old-access', 'valid-refresh');
});

describe('apiRequest', () => {
  it('成功时解包 data', async () => {
    request.mockResolvedValue(okBody({ list: [], total: 0 }));
    await expect(apiRequest(URL)).resolves.toEqual({ list: [], total: 0 });
  });

  it('业务失败时抛出后端提示', async () => {
    request.mockResolvedValue(errBody(400, '邮箱已存在'));
    await expect(apiRequest(URL)).rejects.toThrow('邮箱已存在');
  });

  it('没有权限时提示业务错误，不跳登录', async () => {
    request.mockResolvedValue(errBody(403, '没有该操作权限'));
    await expect(apiRequest(URL)).rejects.toThrow('没有该操作权限');
    expect(historyReplace).not.toHaveBeenCalled();
  });

  it('响应结构不合法时抛出可读错误', async () => {
    request.mockResolvedValue(undefined);
    await expect(apiRequest(URL)).rejects.toThrow('接口响应异常');
  });

  it('业务码 401 时先续期再重试，调用方无感', async () => {
    request
      .mockResolvedValueOnce(errBody(401, '未登录或登录已过期'))
      .mockResolvedValueOnce(okBody({ list: [1], total: 1 }));
    mockRefreshResponse(okBody({ accessToken: 'new-access', refreshToken: 'new-refresh' }));

    await expect(apiRequest(URL)).resolves.toEqual({ list: [1], total: 1 });
    expect(request).toHaveBeenCalledTimes(2);
    expect(getAccessToken()).toBe('new-access');
    expect(historyReplace).not.toHaveBeenCalled();
  });

  it('网络层 401 也会走续期重试', async () => {
    request
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce(okBody('ok'));
    mockRefreshResponse(okBody({ accessToken: 'new-access', refreshToken: 'new-refresh' }));

    await expect(apiRequest(URL)).resolves.toBe('ok');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('续期失败时清 token 并带 redirect 回登录页', async () => {
    request.mockResolvedValue(errBody(401, '未登录或登录已过期'));
    mockRefreshResponse(errBody(401, '刷新令牌无效或已过期'));

    await expect(apiRequest(URL)).rejects.toThrow('未登录或登录已过期');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(historyReplace).toHaveBeenCalledWith(
      '/login?redirect=%2Fsystem%2Fuser',
    );
  });

  it('续期成功但重试仍未授权时也回登录页，不会静默失败', async () => {
    request.mockResolvedValue(errBody(401, '未登录或登录已过期'));
    mockRefreshResponse(okBody({ accessToken: 'new-access', refreshToken: 'new-refresh' }));

    await expect(apiRequest(URL)).rejects.toThrow('未登录或登录已过期');
    expect(request).toHaveBeenCalledTimes(2);
    expect(historyReplace).toHaveBeenCalled();
  });

  it('没有 refreshToken 时不发续期请求，直接回登录页', async () => {
    localStorage.clear();
    request.mockResolvedValue(errBody(401, '未登录或登录已过期'));
    const fetchMock = mockRefreshResponse(okBody({}));

    await expect(apiRequest(URL)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(historyReplace).toHaveBeenCalled();
  });

  it('登录接口自身不做续期重试，避免递归', async () => {
    request.mockResolvedValue(errBody(401, '未登录或登录已过期'));
    const fetchMock = mockRefreshResponse(okBody({}));

    await expect(
      apiRequest(LOGIN_URL, { method: 'POST', data: {} }),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('并发 401 只触发一次续期', async () => {
    request.mockImplementation(async (url: string, options: any) => {
      const calls = request.mock.calls.length;
      return calls <= 3 ? errBody(401, '过期') : okBody(`retry-${url}-${!!options}`);
    });
    const fetchMock = mockRefreshResponse(
      okBody({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    );

    const results = await Promise.all([
      apiRequest('/a'),
      apiRequest('/b'),
      apiRequest('/c'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(3);
  });

  it('业务错误抛出 ApiError，便于页面吞掉而不是红屏', async () => {
    request.mockResolvedValue(errBody(400, '存在子部门，无法删除'));
    try {
      await apiRequest(URL);
      throw new Error('should have rejected');
    } catch (e) {
      expect(isApiError(e)).toBe(true);
      expect((e as Error).message).toBe('存在子部门，无法删除');
    }
  });

  it('非 401 的网络异常转为 ApiError，不误清 token', async () => {
    request.mockRejectedValue({ response: { status: 500 }, message: 'boom' });
    try {
      await apiRequest(URL);
      throw new Error('should have rejected');
    } catch (e) {
      expect(isApiError(e)).toBe(true);
      expect((e as Error).message).toBe('boom');
    }
    expect(getAccessToken()).toBe('old-access');
    expect(historyReplace).not.toHaveBeenCalled();
  });

  it('账号被顶下线时把原因带到登录页', async () => {
    const kicked = '账号已在其它设备登录，当前会话已下线';
    request.mockResolvedValue(errBody(401, kicked));
    mockRefreshResponse(errBody(401, '刷新令牌无效或已过期'));

    await expect(apiRequest(URL)).rejects.toThrow(kicked);
    expect(takeLogoutReason()).toBe(kicked);
    // 只提示一次
    expect(takeLogoutReason()).toBeNull();
  });

  it('已经在登录页时不再重复跳转', async () => {
    (globalThis as any).window.location = { pathname: '/login', search: '' };
    request.mockResolvedValue(errBody(401, '过期'));
    mockRefreshResponse(errBody(401, '无效'));

    await expect(apiRequest(URL)).rejects.toThrow();
    expect(historyReplace).not.toHaveBeenCalled();
  });
});
