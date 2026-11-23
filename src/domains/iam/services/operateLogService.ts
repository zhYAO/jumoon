import type { PageQuery, PageResult } from '@/shared/api/types';
import { apiRequest } from '@/shared/api/client';
import type { SysOperateLog } from '../types';

const BASE = '/admin-api/system/operate-log';

export type OperateLogPageQuery = PageQuery & {
  userEmail?: string;
  module?: string;
  actionName?: string;
  resultCode?: number;
  success?: boolean;
  beginTime?: string;
  endTime?: string;
};

export const operateLogService = {
  page(params: OperateLogPageQuery) {
    return apiRequest<PageResult<SysOperateLog>>(`${BASE}/page`, { method: 'GET', params });
  },
};
