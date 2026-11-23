import { apiRequest } from '@/shared/api/client';

const BASE = '/admin-api/system/permission';

export const permissionService = {
  listRoleMenus(roleId: number) {
    return apiRequest<number[]>(`${BASE}/list-role-menus`, {
      method: 'GET',
      params: { roleId },
    });
  },
  assignRoleMenu(roleId: number, menuIds: number[]) {
    return apiRequest<boolean>(`${BASE}/assign-role-menu`, {
      method: 'POST',
      data: { roleId, menuIds },
    });
  },
  assignRoleDataScope(roleId: number, dataScope: number, dataScopeDeptIds: number[] = []) {
    return apiRequest<boolean>(`${BASE}/assign-role-data-scope`, {
      method: 'POST',
      data: { roleId, dataScope, dataScopeDeptIds },
    });
  },
  listUserRoles(userId: number) {
    return apiRequest<number[]>(`${BASE}/list-user-roles`, {
      method: 'GET',
      params: { userId },
    });
  },
  assignUserRole(userId: number, roleIds: number[]) {
    return apiRequest<boolean>(`${BASE}/assign-user-role`, {
      method: 'POST',
      data: { userId, roleIds },
    });
  },
};
