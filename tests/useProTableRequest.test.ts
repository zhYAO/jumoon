import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/client';
import {
  runProTableRequest,
  toPageQuery,
} from '@/shared/hooks/useProTableRequest';

describe('toPageQuery', () => {
  it('默认第 1 页、每页 20', () => {
    expect(toPageQuery({})).toEqual({ pageNo: 1, pageSize: 20 });
  });

  it('映射 current → pageNo', () => {
    expect(toPageQuery({ current: 3, pageSize: 50 })).toEqual({ pageNo: 3, pageSize: 50 });
  });

  it('非法页码回退为 1', () => {
    expect(toPageQuery({ current: 0 }).pageNo).toBe(1);
    expect(toPageQuery({ current: -2 }).pageNo).toBe(1);
    expect(toPageQuery({ current: 'x' as any }).pageNo).toBe(1);
  });

  it('pageSize 越界钳制到 [1,100]，过小回退默认 20', () => {
    expect(toPageQuery({ pageSize: 0 }).pageSize).toBe(20);
    expect(toPageQuery({ pageSize: 999 }).pageSize).toBe(100);
  });
});

describe('runProTableRequest', () => {
  it('成功时返回 data/total/success', async () => {
    const fetcher = vi.fn(async () => ({
      list: [{ id: 1 }, { id: 2 }],
      total: 2,
    }));
    const result = await runProTableRequest({ current: 1, pageSize: 20 }, fetcher);
    expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }], total: 2, success: true });
    expect(fetcher).toHaveBeenCalledWith({ pageNo: 1, pageSize: 20 });
  });

  it('mapParams 合并筛选项', async () => {
    const fetcher = vi.fn(async () => ({ list: [], total: 0 }));
    await runProTableRequest(
      { current: 2, pageSize: 20, email: 'a@b.com' },
      fetcher,
      {
        mapParams: (p) => ({ email: p.email as string }),
      },
    );
    expect(fetcher).toHaveBeenCalledWith({ pageNo: 2, pageSize: 20, email: 'a@b.com' });
  });

  it('beforeFetch 返回 false 时不请求', async () => {
    const fetcher = vi.fn(async () => ({ list: [{ id: 1 }], total: 1 }));
    const result = await runProTableRequest({ current: 1 }, fetcher, {
      beforeFetch: async () => false,
    });
    expect(result).toEqual({ data: [], total: 0, success: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('ApiError 吞掉并返回空表，不抛红屏', async () => {
    const fetcher = vi.fn(async () => {
      throw new ApiError('无权限', 403);
    });
    const result = await runProTableRequest({ current: 1 }, fetcher);
    expect(result).toEqual({ data: [], total: 0, success: false });
  });

  it('非 ApiError 继续抛出', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('boom');
    });
    await expect(runProTableRequest({ current: 1 }, fetcher)).rejects.toThrow('boom');
  });

  it('容错：list/total 异常时给安全默认值', async () => {
    const fetcher = vi.fn(async () => ({ list: null as any, total: -1 }));
    const result = await runProTableRequest({ current: 1 }, fetcher);
    expect(result).toEqual({ data: [], total: 0, success: true });
  });
});
