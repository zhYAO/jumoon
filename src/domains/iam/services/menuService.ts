import { apiRequest } from '@/shared/api/client';
import type { SysMenu } from '../types';

const BASE = '/admin-api/system/menu';

export const menuService = {
  list(params?: { name?: string; status?: number }, silent = false) {
    return apiRequest<SysMenu[]>(`${BASE}/list`, { method: 'GET', params, skipErrorToast: silent });
  },
  tree() {
    return apiRequest<any[]>(`${BASE}/tree`, { method: 'GET' });
  },
  listAllSimple() {
    return apiRequest<{ id: number; parentId: number; name: string; type: number }[]>(
      `${BASE}/list-all-simple`,
      { method: 'GET' },
    );
  },
  get(id: number) {
    return apiRequest<SysMenu>(`${BASE}/get`, { method: 'GET', params: { id } });
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
