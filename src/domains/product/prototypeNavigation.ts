export type PrototypeRole =
  | 'architecture'
  | 'business'
  | 'owner'
  | 'operator'
  | 'finance'
  | 'executive';

export type BusinessRole = Exclude<PrototypeRole, 'architecture'>;
export type ProductPhase = 'phase1' | 'future';

export type ProductModule = {
  path: string;
  title: string;
  group: string;
  phase: ProductPhase;
  layer: string;
  description: string;
  input: string;
  output: string;
  roles: BusinessRole[];
  roleActions: Partial<Record<BusinessRole, string[]>>;
};

export const PROTOTYPE_ROLE_STORAGE_KEY = 'jumoon.prototype.role';

/** 演示切换：四业务角色 + 全局架构（看全菜单含系统管理） */
export const PROTOTYPE_ROLES: Array<{
  value: PrototypeRole;
  label: string;
  shortLabel: string;
  description: string;
  demo?: boolean;
}> = [
  {
    value: 'business',
    label: '商务',
    shortLabel: '商务',
    description: '建项目、定预算、分配人；可看付款记录。',
    demo: true,
  },
  {
    value: 'operator',
    label: '运营（BD）',
    shortLabel: '运营 BD',
    description: '达人/合作/付款申请；不审付款。',
    demo: true,
  },
  {
    value: 'finance',
    label: '财务',
    shortLabel: '财务',
    description: '只审付款与看付款记录/财务看板；不管项目。',
    demo: true,
  },
  {
    value: 'executive',
    label: '老板',
    shortLabel: '老板',
    description: '全菜单；经营看板。',
    demo: true,
  },
  {
    value: 'architecture',
    label: '全局架构',
    shortLabel: '全菜单',
    description: '查看完整菜单（含系统管理）。',
  },
  {
    value: 'owner',
    label: 'Owner BD',
    shortLabel: 'Owner',
    description: '运营视角 + 负责项目可改成本/名单。',
  },
];
/**
 * 一期角色 × 目录（严谨版）
 *
 * 原则：菜单 = 这个角色的日常工作台，不是「所有人看同一套再靠数据过滤」。
 *
 * | 目录           | 商务 | 运营/Owner | 财务 | 老板 |
 * |----------------|:----:|:----------:|:----:|:----:|
 * | 工作台         |  ✅  |     ✅     |  ✅  |  ✅  |
 * | 看板           |  ✅  |     ✅     |  ✅  |  ✅  |
 * | 项目管理       |  ✅  |     ✅     |  ❌  |  ✅  |
 * | 达人库         |  ✅  |     ✅     |  ❌  |  ✅  |
 * | 合作管理       |  ✅  |     ✅     |  ❌  |  ✅  |
 * | 付款申请       |  ❌  |     ✅     |  ❌  |  ✅  |
 * | 财务审批       |  ❌  |     ❌     |  ✅  |  ✅  |
 * | 付款记录       |  ✅  |     ✅     |  ✅  |  ✅  |
 * | 系统管理       |  ❌  |     ❌     |  ❌  |  ✅  |
 *
 * 财务为什么没有项目管理 / 合作 / 达人：
 * 付款单上已带「项目名、达人、金额、账号」；财务职责是审付与记账，不建项目、不谈合作。
 */
const modules: ProductModule[] = [
  {
    path: '/home',
    title: '工作台',
    group: '一期',
    phase: 'phase1',
    layer: '总览',
    description: '按角色看待办。',
    input: '三表汇总',
    output: '今日工作',
    roles: ['business', 'owner', 'operator', 'finance', 'executive'],
    roleActions: {},
  },
  {
    path: '/analytics',
    title: '看板',
    group: '一期',
    phase: 'phase1',
    layer: '分析',
    description: '角色专用看板（财务看付款流，其它看项目/经营）。',
    input: '按角色聚合',
    output: '指标',
    roles: ['business', 'owner', 'operator', 'finance', 'executive'],
    roleActions: {},
  },
  {
    path: '/assistant',
    title: 'AI 助手',
    group: '一期',
    phase: 'phase1',
    layer: '助手',
    description: '基于权限的全局管家：看数、串流程、指引到该处理的一步。',
    input: '权限内业务数据',
    output: '分析结论 + 流程指引',
    roles: ['business', 'owner', 'operator', 'finance', 'executive'],
    roleActions: {},
  },
  {
    path: '/campaigns',
    title: '项目管理',
    group: '一期',
    phase: 'phase1',
    layer: '计划',
    description: '创建 / 发布 Campaign，分配 Owner 与运营。',
    input: 'Brief 预算',
    output: '已发布 Campaign',
    roles: ['business', 'owner', 'operator', 'executive'],
    roleActions: {},
  },
  {
    path: '/creators',
    title: '达人库',
    group: '一期',
    phase: 'phase1',
    layer: '达人',
    description: '达人档案；运营主用。',
    input: '手工录入',
    output: 'Creator',
    roles: ['business', 'owner', 'operator', 'executive'],
    roleActions: {},
  },
  {
    path: '/cooperations',
    title: '合作管理',
    group: '一期',
    phase: 'phase1',
    layer: '合作',
    description: '正式合作记录；运营主用。',
    input: 'Campaign + Creator',
    output: 'Cooperation',
    roles: ['business', 'owner', 'operator', 'executive'],
    roleActions: {},
  },
  {
    path: '/finance',
    title: '财务管理',
    group: '一期',
    phase: 'phase1',
    layer: '财务',
    description: '付款入口（子菜单按角色裁）。',
    input: 'Cooperation',
    output: 'Payment',
    roles: ['business', 'owner', 'operator', 'finance', 'executive'],
    roleActions: {},
  },
  {
    path: '/finance/payment-requests',
    title: '付款申请',
    group: '财务管理',
    phase: 'phase1',
    layer: '财务',
    description: '运营发起付款。',
    input: 'Cooperation',
    output: 'Payment Request',
    roles: ['owner', 'operator', 'executive'],
    roleActions: {},
  },
  {
    path: '/finance/approvals',
    title: '财务审批',
    group: '财务管理',
    phase: 'phase1',
    layer: '财务',
    description: '财务审核并标记已付。',
    input: 'Payment Request',
    output: '审核结果',
    roles: ['finance', 'executive'],
    roleActions: {},
  },
  {
    path: '/finance/payments',
    title: '付款记录',
    group: '财务管理',
    phase: 'phase1',
    layer: '财务',
    description: '已付与历史。',
    input: '已审核申请',
    output: '付款结果',
    roles: ['business', 'owner', 'operator', 'finance', 'executive'],
    roleActions: {},
  },
];

export const PRODUCT_MODULES = modules;
const MODULE_BY_PATH = new Map(modules.map((m) => [m.path, m]));

export function getPrototypeRole(): PrototypeRole {
  if (typeof window === 'undefined') return 'business';
  const stored = window.localStorage.getItem(PROTOTYPE_ROLE_STORAGE_KEY) as PrototypeRole | null;
  return PROTOTYPE_ROLES.some((r) => r.value === stored) ? stored! : 'business';
}

export function setPrototypeRole(role: PrototypeRole) {
  if (typeof window !== 'undefined') window.localStorage.setItem(PROTOTYPE_ROLE_STORAGE_KEY, role);
}

export function getPrototypeRoleMeta(role = getPrototypeRole()) {
  return PROTOTYPE_ROLES.find((item) => item.value === role) || PROTOTYPE_ROLES[0];
}

export function getProductModule(path: string) {
  return MODULE_BY_PATH.get(path);
}

export function canRoleSeeModule(role: PrototypeRole, path: string) {
  if (role === 'architecture') return true;
  const module = MODULE_BY_PATH.get(path);
  // 未登记的路径（如系统管理子项）默认可见，由其它规则处理
  if (!module) return true;
  return module.roles.includes(role as BusinessRole);
}

type LayoutMenu = { path?: string; children?: LayoutMenu[]; [key: string]: any };

export function isProductPrototypePath(path: string) {
  return MODULE_BY_PATH.has(path);
}

/**
 * 按角色裁剪侧栏目录。
 * 系统管理：仅老板 / 全局架构。
 */
export function filterMenusForPrototypeRole(menuData: LayoutMenu[], role = getPrototypeRole()) {
  const walk = (items: LayoutMenu[]): LayoutMenu[] =>
    items.flatMap((item) => {
      if (item.path === '/system' && role !== 'executive' && role !== 'architecture') return [];

      const children = item.children?.length ? walk(item.children) : undefined;

      // 有子菜单：只保留仍有子项的父级
      if (item.children?.length) {
        if (!children?.length) return [];
        return [{ ...item, children }];
      }

      // 叶子：按模块角色表过滤
      if (item.path && MODULE_BY_PATH.has(item.path) && !canRoleSeeModule(role, item.path)) {
        return [];
      }

      return [{ ...item, children }];
    });
  return walk(menuData);
}

export function modulesForRole(role = getPrototypeRole()) {
  return role === 'architecture' ? modules : modules.filter((m) => m.roles.includes(role as BusinessRole));
}

/** 进入无权限财务子页时的默认落地页 */
export function defaultFinancePathForRole(role = getPrototypeRole()) {
  if (canRoleSeeModule(role, '/finance/approvals')) return '/finance/approvals';
  if (canRoleSeeModule(role, '/finance/payment-requests')) return '/finance/payment-requests';
  if (canRoleSeeModule(role, '/finance/payments')) return '/finance/payments';
  return '/home';
}
