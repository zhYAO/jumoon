import { useCallback, useRef } from 'react';
import { isApiError } from '@/shared/api/client';
import type { PageQuery, PageResult } from '@/shared/api/types';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '@/shared/constants/pagination';

/** ProTable request 入参（current / pageSize + 筛选项） */
export type ProTableQueryParams = {
  current?: number;
  pageSize?: number;
  [key: string]: unknown;
};

export type ProTableRequestResult<T> = {
  data: T[];
  total: number;
  success: boolean;
};

export type PageQueryNormalized = {
  pageNo: number;
  pageSize: number;
};

/** 将 ProTable 的 current/pageSize 规范成后端 pageNo/pageSize */
export function toPageQuery(params: ProTableQueryParams): PageQueryNormalized {
  const current = Number(params.current);
  const size = Number(params.pageSize);
  const pageNo = Number.isFinite(current) && current >= 1 ? Math.floor(current) : 1;
  let pageSize = Number.isFinite(size) ? Math.floor(size) : DEFAULT_PAGE_SIZE;
  if (pageSize < MIN_PAGE_SIZE) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
  return { pageNo, pageSize };
}

export type RunProTableRequestOptions<T, Q extends Record<string, unknown>> = {
  /** 把 ProTable 筛选项映射成后端查询字段（不含分页） */
  mapParams?: (params: ProTableQueryParams) => Q | Promise<Q>;
  /**
   * 发请求前校验；返回 false 则中止（如未选必填时间）。
   * 此时 success=false，表格不展示错误红屏。
   */
  beforeFetch?: (
    params: ProTableQueryParams,
    query: PageQuery & Q,
  ) => boolean | Promise<boolean>;
};

/**
 * 纯函数版：便于单测。把 ProTable request 接到 `{ list, total }` 分页接口。
 */
export async function runProTableRequest<T, Q extends Record<string, unknown> = Record<string, never>>(
  params: ProTableQueryParams,
  fetcher: (query: PageQuery & Q) => Promise<PageResult<T>>,
  options?: RunProTableRequestOptions<T, Q>,
): Promise<ProTableRequestResult<T>> {
  try {
    const page = toPageQuery(params);
    const extra = (options?.mapParams ? await options.mapParams(params) : {}) as Q;
    const query = { ...page, ...extra } as PageQuery & Q;
    if (options?.beforeFetch && !(await options.beforeFetch(params, query))) {
      return { data: [], total: 0, success: false };
    }
    const result = await fetcher(query);
    const list = Array.isArray(result?.list) ? result.list : [];
    const total = typeof result?.total === 'number' && result.total >= 0 ? result.total : 0;
    return { data: list, total, success: true };
  } catch (e) {
    if (!isApiError(e)) throw e;
    return { data: [], total: 0, success: false };
  }
}

/**
 * ProTable 分页查询 Hook。
 * fetcher / options 用 ref 保存最新引用，避免父组件每次 render 重建 request。
 */
export function useProTableRequest<T, Q extends Record<string, unknown> = Record<string, never>>(
  fetcher: (query: PageQuery & Q) => Promise<PageResult<T>>,
  options?: RunProTableRequestOptions<T, Q>,
) {
  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);
  fetcherRef.current = fetcher;
  optionsRef.current = options;

  return useCallback((params: ProTableQueryParams) => {
    return runProTableRequest<T, Q>(params, fetcherRef.current, optionsRef.current);
  }, []);
}
