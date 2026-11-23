import { apiRequest } from '@/shared/api/client';
import type { SysDept } from '../types';

const BASE = '/admin-api/system/dept';

export const deptService = {
  list(params?: { name?: string; status?: number }) {
    return apiRequest<SysDept[]>(`${BASE}/list`, { method: 'GET', params });
  },
  tree(silent = false, params?: { status?: number }) {
    return apiRequest<SysDept[]>(`${BASE}/tree`, {
      method: 'GET',
      params,
      skipErrorToast: silent,
    });
  },
  simpleList() {
    return apiRequest<{ id: number; parentId: number; name: string }[]>(`${BASE}/simple-list`, {
      method: 'GET',
    });
  },
  get(id: number) {
    return apiRequest<SysDept>(`${BASE}/get`, { method: 'GET', params: { id } });
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
