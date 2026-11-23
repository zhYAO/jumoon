import { describe, expect, it } from 'vitest';
import { buildAccessMap } from '@/domains/iam/utils/accessFactory';

describe('buildAccessMap', () => {
  it('未登录时关闭所有入口', () => {
    const access = buildAccessMap(null);
    expect(Object.values(access).every((v) => v === false)).toBe(true);
  });

  it('超管放开全部入口', () => {
    const access = buildAccessMap({
      user: { id: 1, email: 'a@b.com', username: 'a', nickname: 'A' },
      roles: ['super_admin'],
      permissions: [],
      menus: [],
      isSuperAdmin: true,
    });
    expect(Object.values(access).every((v) => v === true)).toBe(true);
  });

  it('只开放已授予的权限点', () => {
    const access = buildAccessMap({
      user: { id: 2, email: 'b@b.com', username: 'b', nickname: 'B' },
      roles: ['reader'],
      permissions: ['system:user:query'],
      menus: [],
      isSuperAdmin: false,
    });
    expect(access.canUserQuery).toBe(true);
    expect(access.canUserList).toBe(true);
    expect(access.canUserCreate).toBe(false);
    expect(access.canUserDelete).toBe(false);
    expect(access.canRoleQuery).toBe(false);
    expect(access.canAdmin).toBe(true);
  });

  it('用户管理入口与查询共用 system:user:query', () => {
    const access = buildAccessMap({
      user: { id: 4, email: 'd@b.com', username: 'd', nickname: 'D' },
      roles: ['pm'],
      permissions: ['system:user:query'],
      menus: [],
      isSuperAdmin: false,
    });
    expect(access.canUserList).toBe(true);
    expect(access.canUserQuery).toBe(true);
  });

  it('权限点之间互不串味', () => {
    const access = buildAccessMap({
      user: { id: 3, email: 'c@b.com', username: 'c', nickname: 'C' },
      roles: ['dept_admin'],
      permissions: ['system:dept:update'],
      menus: [],
      isSuperAdmin: false,
    });
    expect(access.canDeptUpdate).toBe(true);
    expect(access.canDeptDelete).toBe(false);
    expect(access.canUserUpdate).toBe(false);
    expect(access.canOperateLogQuery).toBe(false);
  });
});
