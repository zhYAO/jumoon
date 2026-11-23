import { describe, expect, it } from 'vitest';
import {
  canRoleSeeModule,
  filterMenusForPrototypeRole,
  getProductModule,
  modulesForRole,
} from '@/domains/product/prototypeNavigation';

describe('prototype product navigation', () => {
  it('完整架构包含第一期与后续模块', () => {
    expect(modulesForRole('architecture').some((item) => item.path === '/project/campaigns')).toBe(true);
    expect(modulesForRole('architecture').some((item) => item.path === '/creator-outreach/outreach')).toBe(true);
    expect(getProductModule('/analytics/management')?.phase).toBe('phase1');
  });

  it('运营可见合作和付款申请，不可见财务审批', () => {
    expect(canRoleSeeModule('operator', '/project/cooperations')).toBe(true);
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
