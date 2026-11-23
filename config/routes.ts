export default [
  {
    path: '/login',
    layout: false,
    component: './Login',
  },
  {
    path: '/change-password',
    layout: false,
    component: './ChangePassword',
  },
  {
    path: '/',
    redirect: '/home',
  },

  // —— 一期平铺菜单：同一套模块，角色只影响可见数据 ——
  {
    name: '工作台',
    path: '/home',
    component: './Home',
    icon: 'DashboardOutlined',
  },
  {
    name: '看板',
    path: '/analytics',
    component: './Analytics',
    icon: 'BarChartOutlined',
  },
  {
    name: 'AI 助手',
    path: '/assistant',
    component: './Assistant',
    icon: 'RobotOutlined',
  },
  {
    name: '项目管理',
    path: '/campaigns',
    icon: 'ProjectOutlined',
    routes: [
      {
        path: '/campaigns',
        component: './Campaigns',
        hideInMenu: true,
      },
      {
        path: '/campaigns/:id',
        component: './Campaigns/Detail',
        hideInMenu: true,
      },
    ],
  },
  {
    name: '达人库',
    path: '/creators',
    component: './Creators',
    icon: 'TeamOutlined',
  },
  {
    name: '合作管理',
    path: '/cooperations',
    component: './Cooperations',
    icon: 'SolutionOutlined',
  },
  {
    name: '财务管理',
    path: '/finance',
    icon: 'WalletOutlined',
    routes: [
      {
        name: '付款申请',
        path: '/finance/payment-requests',
        component: './Payments',
        icon: 'FileTextOutlined',
      },
      {
        name: '财务审批',
        path: '/finance/approvals',
        component: './Payments',
        icon: 'AuditOutlined',
      },
      {
        name: '付款记录',
        path: '/finance/payments',
        component: './Payments',
        icon: 'BankOutlined',
      },
      { path: '/finance', redirect: '/finance/payment-requests', hideInMenu: true },
    ],
  },

  // 旧路径兼容（不进菜单）
  { path: '/project', redirect: '/campaigns', hideInMenu: true },
  { path: '/project/campaigns', redirect: '/campaigns', hideInMenu: true },
  { path: '/project/cooperations', redirect: '/cooperations', hideInMenu: true },
  { path: '/project/execution', redirect: '/campaigns', hideInMenu: true },
  { path: '/creator-outreach', redirect: '/creators', hideInMenu: true },
  { path: '/creator-outreach/creators', redirect: '/creators', hideInMenu: true },
  { path: '/creator-outreach/cold-list', redirect: '/creators', hideInMenu: true },
  { path: '/creator-outreach/outreach', redirect: '/creators', hideInMenu: true },
  { path: '/creator-outreach/replies', redirect: '/creators', hideInMenu: true },
  { path: '/analytics/campaign', redirect: '/analytics', hideInMenu: true },
  { path: '/analytics/finance', redirect: '/analytics', hideInMenu: true },
  { path: '/analytics/management', redirect: '/analytics', hideInMenu: true },
  { path: '/analytics/creators', redirect: '/analytics', hideInMenu: true },

  {
    name: '系统管理',
    path: '/system',
    icon: 'SettingOutlined',
    routes: [
      {
        name: '用户管理',
        path: '/system/user',
        component: './system/User',
        access: 'canUserList',
        icon: 'UserOutlined',
      },
      {
        name: '角色管理',
        path: '/system/role',
        component: './system/Role',
        access: 'canRoleQuery',
        icon: 'TeamOutlined',
      },
      {
        name: '菜单管理',
        path: '/system/menu',
        component: './system/Menu',
        access: 'canMenuQuery',
        icon: 'MenuOutlined',
      },
      {
        name: '部门管理',
        path: '/system/dept',
        component: './system/Dept',
        access: 'canDeptQuery',
        icon: 'ApartmentOutlined',
      },
      {
        name: '操作日志',
        path: '/system/operate-log',
        component: './system/OperateLog',
        access: 'canOperateLogQuery',
        icon: 'AuditOutlined',
      },
    ],
  },
  {
    path: '/user',
    redirect: '/system/user',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
