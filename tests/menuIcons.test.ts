import { describe, expect, it } from 'vitest';
import {
  collectIconByPath,
  collectMenuPaths,
  iconNameForMenuPath,
  resolveMenuIconName,
} from '@/shared/icons/menuIcons';
import { filterLayoutMenusByBackend } from '@/shared/icons/applyLayoutMenuIcons';

describe('resolveMenuIconName', () => {
  it('空值返回空', () => {
    expect(resolveMenuIconName(null)).toBeNull();
    expect(resolveMenuIconName('')).toBeNull();
    expect(resolveMenuIconName('   ')).toBeNull();
  });

  it('识别 Ant Design 组件名', () => {
    expect(resolveMenuIconName('UserOutlined')).toBe('UserOutlined');
    expect(resolveMenuIconName('useroutlined')).toBe('UserOutlined');
  });

  it('兼容芋道种子里的短名', () => {
    expect(resolveMenuIconName('settings')).toBe('SettingOutlined');
    expect(resolveMenuIconName('user')).toBe('UserOutlined');
    expect(resolveMenuIconName('role')).toBe('TeamOutlined');
    expect(resolveMenuIconName('menu')).toBe('MenuOutlined');
    expect(resolveMenuIconName('tree')).toBe('ApartmentOutlined');
  });

  it('未知名称原样保留，避免把库里的值抹掉', () => {
    expect(resolveMenuIconName('custom-icon')).toBe('custom-icon');
  });
});

describe('collectIconByPath', () => {
  it('把相对路由拼成侧栏用的绝对路径', () => {
    const map = collectIconByPath([
      {
        id: 1,
        parentId: 0,
        name: '系统管理',
        path: '/system',
        icon: 'settings',
        children: [
          { id: 2, parentId: 1, name: '角色管理', path: 'role', icon: 'role' },
        ],
      },
    ]);
    expect(map.get('/system')).toBe('settings');
    expect(map.get('/system/role')).toBe('role');
  });
});

describe('iconNameForMenuPath', () => {
  it('后端配置优先于默认图标', () => {
    const backend = new Map([['/system/role', 'CrownOutlined']]);
    expect(iconNameForMenuPath('/system/role', backend)).toBe('CrownOutlined');
  });

  it('没有后端配置时用模块默认图标', () => {
    expect(iconNameForMenuPath('/system/user', new Map())).toBe('UserOutlined');
    expect(iconNameForMenuPath('/home', new Map())).toBe('DashboardOutlined');
  });
});

describe('filterLayoutMenusByBackend', () => {
  const layout = [
    { path: '/home', name: '首页' },
    {
      path: '/system',
      name: '系统管理',
      children: [
        { path: '/system/user', name: '用户管理' },
        { path: '/system/role', name: '角色管理' },
        { path: '/system/menu', name: '菜单管理' },
      ],
    },
  ];

  it('停用的页面从侧栏去掉，首页仍在', () => {
    const visible = filterLayoutMenusByBackend(layout, [
      {
        path: '/system',
        children: [{ path: 'role' }, { path: 'menu' }],
      },
    ]);
    expect(visible.map((n) => n.path)).toEqual(['/home', '/system']);
    expect(visible[1].children?.map((n) => n.path)).toEqual(['/system/role', '/system/menu']);
  });

  it('停用整组目录后侧栏只剩首页', () => {
    const visible = filterLayoutMenusByBackend(layout, []);
    expect(visible.map((n) => n.path)).toEqual(['/home']);
  });

  it('后端若缺父目录只返回相对 path，侧栏会对不上（应由后端补上级）', () => {
    const visible = filterLayoutMenusByBackend(layout, [{ path: 'role' }, { path: 'dept' }]);
    expect(visible.map((n) => n.path)).toEqual(['/home']);
  });

  it('后端返回目录+相对子 path 时侧栏正常', () => {
    const visible = filterLayoutMenusByBackend(layout, [
      { path: '/system', children: [{ path: 'role' }] },
    ]);
    expect(visible.map((n) => n.path)).toEqual(['/home', '/system']);
    expect(visible[1].children?.map((n) => n.path)).toEqual(['/system/role']);
  });

  it('原型业务菜单在后端尚未配置时仍可见', () => {
    const visible = filterLayoutMenusByBackend(
      [
        { path: '/home', name: '工作台' },
        {
          path: '/project',
          name: '项目管理',
          children: [
            { path: '/project/campaigns', name: 'Campaign 计划' },
            { path: '/project/cooperations', name: '合作管理' },
          ],
        },
      ],
      [],
    );
    expect(visible.map((n) => n.path)).toEqual(['/home', '/project']);
    expect(visible[1].children?.map((n) => n.path)).toEqual(['/project/campaigns', '/project/cooperations']);
  });
});
