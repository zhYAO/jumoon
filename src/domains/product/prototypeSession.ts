import type { PermissionInfo } from '@/domains/iam/types';

const PROTOTYPE_SESSION_KEY = 'jumoon.prototype.session';

export function isPrototypeSession() {
  return (
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    window.localStorage.getItem(PROTOTYPE_SESSION_KEY) === 'enabled'
  );
}

export function enablePrototypeSession() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.localStorage.setItem(PROTOTYPE_SESSION_KEY, 'enabled');
  }
}

export function clearPrototypeSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(PROTOTYPE_SESSION_KEY);
}

export const PROTOTYPE_PERMISSION_INFO: PermissionInfo = {
  user: {
    id: 0,
    email: 'prototype@jumoon.local',
    username: 'prototype',
    nickname: '产品原型',
  },
  roles: ['prototype_reviewer'],
  permissions: [],
  isSuperAdmin: true,
  mustChangePassword: false,
  menus: [
    {
      id: 9000,
      parentId: 0,
      name: '系统管理',
      path: '/system',
      icon: 'SettingOutlined',
      children: [
        { id: 9001, parentId: 9000, name: '用户管理', path: 'user', icon: 'UserOutlined' },
        { id: 9002, parentId: 9000, name: '角色管理', path: 'role', icon: 'TeamOutlined' },
        { id: 9003, parentId: 9000, name: '菜单管理', path: 'menu', icon: 'MenuOutlined' },
        { id: 9004, parentId: 9000, name: '部门管理', path: 'dept', icon: 'ApartmentOutlined' },
        { id: 9005, parentId: 9000, name: '操作日志', path: 'operate-log', icon: 'AuditOutlined' },
      ],
    },
  ],
};
