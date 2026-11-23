import { describe, expect, it } from 'vitest';
import routes from '../config/routes';
import {
  canRoleSeeModule,
  filterMenusForPrototypeRole,
  getProductModule,
  modulesForRole,
} from '@/domains/product/prototypeNavigation';

describe('prototype product navigation', () => {
  it('完整架构使用一期菜单的正式路径', () => {
    const paths = modulesForRole('architecture').map((item) => item.path);
    expect(paths).toEqual(expect.arrayContaining(['/campaigns', '/creators', '/analytics']));
    expect(getProductModule('/analytics')?.phase).toBe('phase1');
  });

  it('旧业务路径继续重定向，且不出现在菜单中', () => {
    expect(routes).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '/project/campaigns', redirect: '/campaigns', hideInMenu: true }),
      expect.objectContaining({ path: '/creator-outreach/outreach', redirect: '/creators', hideInMenu: true }),
      expect.objectContaining({ path: '/analytics/management', redirect: '/analytics', hideInMenu: true }),
    ]));
  });

  it('运营可见合作和付款申请，不可见财务审批', () => {
    expect(canRoleSeeModule('operator', '/cooperations')).toBe(true);
    expect(canRoleSeeModule('operator', '/finance/payment-requests')).toBe(true);
    expect(canRoleSeeModule('operator', '/finance/approvals')).toBe(false);
  });

  it('角色菜单移除无权限叶子', () => {
    const menu = [
      { path: '/home', name: '工作台' },
      {
        path: '/finance',
        name: '财务管理',
        children: [
          { path: '/finance/payment-requests', name: '付款申请' },
          { path: '/finance/approvals', name: '财务审批' },
        ],
      },
    ];
    const visible = filterMenusForPrototypeRole(menu, 'operator');
    expect(visible[1].children?.map((item) => item.path)).toEqual(['/finance/payment-requests']);
  });
});
