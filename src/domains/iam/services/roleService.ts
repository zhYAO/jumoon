import { apiRequest } from '@/shared/api/client';
import type { PageQuery, PageResult } from '@/shared/api/types';
import type { SysRole } from '../types';

const BASE = '/admin-api/system/role';

export const roleService = {
  page(params: PageQuery & { name?: string; code?: string; status?: number }) {
    return apiRequest<PageResult<SysRole>>(`${BASE}/page`, { method: 'GET', params });
  },
  get(id: number) {
    return apiRequest<SysRole>(`${BASE}/get`, { method: 'GET', params: { id } });
  },
  listAllSimple(silent = false) {
    return apiRequest<{ id: number; name: string; code: string }[]>(`${BASE}/list-all-simple`, {
      method: 'GET',
      skipErrorToast: silent,
    });
  },
  create(data: Record<string, any>) {
    return apiRequest<number>(`${BASE}/create`, { method: 'POST', data });
  },
  update(data: Record<string, any>) {
    return apiRequest<boolean>(`${BASE}/update`, { method: 'PUT', data });
  },
  remove(id: number) {
    return apiRequest<boolean>(`${BASE}/delete`, { method: 'DELETE', params: { id } });
  },
};
