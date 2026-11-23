/** IAM 领域类型 */

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  nickname: string;
  deptId?: number | null;
};

export type MenuNode = {
  id: number;
  parentId: number;
  name: string;
  path?: string | null;
  component?: string | null;
  componentName?: string | null;
  icon?: string | null;
  visible?: boolean;
  keepAlive?: boolean;
  alwaysShow?: boolean;
  children?: MenuNode[];
};

export type PermissionInfo = {
  user: AuthUser;
  roles: string[];
  permissions: string[];
  menus: MenuNode[];
  isSuperAdmin: boolean;
  mustChangePassword?: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type TokenPayload = {
  accessToken: string;
  refreshToken: string;
  expiresTime: string;
  mustChangePassword?: boolean;
};

export type SysUser = {
  id: number;
  username: string;
  email: string;
  nickname: string;
  mobile?: string | null;
  deptId?: number | null;
  deptName?: string | null;
  status: number;
  remark?: string | null;
  loginIp?: string | null;
  loginDate?: string | null;
  createdAt?: string | null;
  roleIds?: number[];
  roleNames?: string[];
};

export type SysRole = {
  id: number;
  name: string;
  code: string;
  sort: number;
  status: number;
  type: number;
  dataScope: number;
  remark?: string | null;
  createdAt?: string | null;
  menuIds?: number[];
  dataScopeDeptIds?: number[];
};

export type SysMenu = {
  id: number;
  parentId: number;
  name: string;
  type: number;
  sort: number;
  path?: string | null;
  component?: string | null;
  componentName?: string | null;
  permission?: string;
  icon?: string | null;
  status: number;
  visible: number;
  keepAlive: number;
  alwaysShow: number;
};

export type SysDept = {
  id: number;
  parentId: number;
  name: string;
  pathName?: string;
  sort: number;
  status: number;
  leaderUserId?: number | null;
  children?: SysDept[];
};

export type SysOperateLog = {
  id: number;
  userId?: number | null;
  userEmail?: string | null;
  module: string;
  actionName: string;
  bizType?: string | null;
  bizId?: string | null;
  requestMethod: string;
  requestUrl: string;
  requestParams?: string | null;
  resultCode: number;
  resultMsg?: string | null;
  beforeData?: string | null;
  afterData?: string | null;
  userIp?: string | null;
  userAgent?: string | null;
  durationMs: number;
  createdAt?: string | null;
};

/** 菜单 type：1目录 2菜单 3按钮 */
export const MENU_TYPE = {
  DIR: 1,
  MENU: 2,
  BUTTON: 3,
} as const;

export const DATA_SCOPE = {
  ALL: 1,
  CUSTOM: 2,
  DEPT: 3,
  DEPT_AND_CHILD: 4,
  SELF: 5,
} as const;

export function dataScopeValueEnum(text: (id: string) => string) {
  return {
    [DATA_SCOPE.ALL]: { text: text('system.role.scopeAll') },
    [DATA_SCOPE.CUSTOM]: { text: text('system.role.scopeCustom') },
    [DATA_SCOPE.DEPT]: { text: text('system.role.scopeDept') },
    [DATA_SCOPE.DEPT_AND_CHILD]: { text: text('system.role.scopeDeptAndChild') },
    [DATA_SCOPE.SELF]: { text: text('system.role.scopeSelf') },
  };
}

export const DATA_SCOPE_VALUE_ENUM = {
  [DATA_SCOPE.ALL]: { text: '全部数据' },
  [DATA_SCOPE.CUSTOM]: { text: '指定部门' },
  [DATA_SCOPE.DEPT]: { text: '本部门' },
  [DATA_SCOPE.DEPT_AND_CHILD]: { text: '本部门及以下' },
  [DATA_SCOPE.SELF]: { text: '仅本人' },
};

/** 角色 type：1 内置 / 2 自定义 */
export const ROLE_TYPE = {
  BUILTIN: 1,
  CUSTOM: 2,
} as const;

export function roleTypeValueEnum(text: (id: string) => string) {
  return {
    [ROLE_TYPE.BUILTIN]: { text: text('system.role.builtin') },
    [ROLE_TYPE.CUSTOM]: { text: text('system.role.custom') },
  };
}

export const ROLE_TYPE_VALUE_ENUM = {
  [ROLE_TYPE.BUILTIN]: { text: '内置' },
  [ROLE_TYPE.CUSTOM]: { text: '自定义' },
};
