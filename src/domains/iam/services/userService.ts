import { apiRequest } from '@/shared/api/client';
import type { PageQuery, PageResult } from '@/shared/api/types';
import type { SysUser } from '../types';

const BASE = '/admin-api/system/user';

export type UserPageQuery = PageQuery & {
  email?: string;
  nickname?: string;
  status?: number;
  deptId?: number;
};

export const userService = {
  page(params: UserPageQuery) {
    return apiRequest<PageResult<SysUser>>(`${BASE}/page`, { method: 'GET', params });
  },
  get(id: number) {
    return apiRequest<SysUser>(`${BASE}/get`, { method: 'GET', params: { id } });
  },
  simpleList() {
    return apiRequest<{ id: number; nickname: string; email: string }[]>(`${BASE}/simple-list`, {
      method: 'GET',
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
  updatePassword(id: number, password: string) {
    return apiRequest<boolean>(`${BASE}/update-password`, {
      method: 'PUT',
      data: { id, password },
    });
  },
  updateStatus(id: number, status: number) {
    return apiRequest<boolean>(`${BASE}/update-status`, {
      method: 'PUT',
      data: { id, status },
    });
  },
};
