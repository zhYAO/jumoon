import type { PermissionInfo } from '../types';

/** 由权限信息生成 umi access map */
export function buildAccessMap(info?: PermissionInfo | null) {
  const perms = new Set(info?.permissions || []);
  const superAdmin = !!info?.isSuperAdmin;
  const has = (code: string) => superAdmin || perms.has(code);

  return {
    canAdmin: superAdmin || perms.size > 0,
    // 进入用户管理页与列表查询是同一能力（页面/查询按钮共用 system:user:query）
    canUserList: has('system:user:query'),
    canUserQuery: has('system:user:query'),
    canUserCreate: has('system:user:create'),
    canUserUpdate: has('system:user:update'),
    canUserDelete: has('system:user:delete'),
    canUserUpdatePassword: has('system:user:update-password'),
    canRoleQuery: has('system:role:query'),
    canRoleCreate: has('system:role:create'),
    canRoleUpdate: has('system:role:update'),
    canRoleDelete: has('system:role:delete'),
    canMenuQuery: has('system:menu:query'),
    canMenuCreate: has('system:menu:create'),
    canMenuUpdate: has('system:menu:update'),
    canMenuDelete: has('system:menu:delete'),
    canDeptQuery: has('system:dept:query'),
    canDeptCreate: has('system:dept:create'),
    canDeptUpdate: has('system:dept:update'),
    canDeptDelete: has('system:dept:delete'),
    canOperateLogQuery: has('system:operate-log:query'),
  };
}

export type AccessMap = ReturnType<typeof buildAccessMap>;
