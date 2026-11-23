import {
  ApartmentOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CalendarOutlined,
  CloudOutlined,
  ClusterOutlined,
  CommentOutlined,
  CompassOutlined,
  ContainerOutlined,
  ControlOutlined,
  CrownOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  FileTextOutlined,
  FolderOutlined,
  FundOutlined,
  GiftOutlined,
  GlobalOutlined,
  HomeOutlined,
  IdcardOutlined,
  InboxOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  MenuOutlined,
  MessageOutlined,
  NotificationOutlined,
  PaperClipOutlined,
  PictureOutlined,
  ProfileOutlined,
  ProjectOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  SolutionOutlined,
  TableOutlined,
  TagsOutlined,
  TeamOutlined,
  ToolOutlined,
  TrophyOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';

export type MenuIconItem = {
  name: string;
  label: string;
  aliases: string[];
  Icon: typeof HomeOutlined;
};

/** 侧栏/菜单管理用的图标目录（Outlined，风格统一）。 */
export const MENU_ICON_CATALOG: MenuIconItem[] = [
  { name: 'HomeOutlined', label: '首页', aliases: ['home'], Icon: HomeOutlined },
  { name: 'SettingOutlined', label: '设置', aliases: ['settings', 'setting'], Icon: SettingOutlined },
  { name: 'UserOutlined', label: '用户', aliases: ['user'], Icon: UserOutlined },
  { name: 'TeamOutlined', label: '团队/角色', aliases: ['role', 'team'], Icon: TeamOutlined },
  { name: 'MenuOutlined', label: '菜单', aliases: ['menu'], Icon: MenuOutlined },
  { name: 'ApartmentOutlined', label: '组织/部门', aliases: ['tree', 'dept', 'apartment'], Icon: ApartmentOutlined },
  { name: 'AppstoreOutlined', label: '应用', aliases: ['app', 'appstore'], Icon: AppstoreOutlined },
  { name: 'DashboardOutlined', label: '仪表盘', aliases: ['dashboard'], Icon: DashboardOutlined },
  { name: 'SafetyCertificateOutlined', label: '权限', aliases: ['safety', 'permission'], Icon: SafetyCertificateOutlined },
  { name: 'LockOutlined', label: '锁定', aliases: ['lock'], Icon: LockOutlined },
  { name: 'KeyOutlined', label: '密钥', aliases: ['key'], Icon: KeyOutlined },
  { name: 'IdcardOutlined', label: '证件', aliases: ['idcard'], Icon: IdcardOutlined },
  { name: 'AuditOutlined', label: '审计', aliases: ['audit'], Icon: AuditOutlined },
  { name: 'SolutionOutlined', label: '方案', aliases: ['solution'], Icon: SolutionOutlined },
  { name: 'ProfileOutlined', label: '档案', aliases: ['profile'], Icon: ProfileOutlined },
  { name: 'ProjectOutlined', label: '项目', aliases: ['project'], Icon: ProjectOutlined },
  { name: 'ClusterOutlined', label: '集群', aliases: ['cluster'], Icon: ClusterOutlined },
  { name: 'BankOutlined', label: '机构', aliases: ['bank'], Icon: BankOutlined },
  { name: 'ShopOutlined', label: '店铺', aliases: ['shop'], Icon: ShopOutlined },
  { name: 'WalletOutlined', label: '钱包', aliases: ['wallet', 'finance'], Icon: WalletOutlined },
  { name: 'FundOutlined', label: '资金', aliases: ['fund'], Icon: FundOutlined },
  { name: 'BarChartOutlined', label: '图表', aliases: ['chart', 'bar-chart'], Icon: BarChartOutlined },
  { name: 'RobotOutlined', label: 'AI助手', aliases: ['robot', 'ai', 'assistant'], Icon: RobotOutlined },
  { name: 'TableOutlined', label: '表格', aliases: ['table'], Icon: TableOutlined },
  { name: 'FileTextOutlined', label: '文档', aliases: ['file', 'file-text'], Icon: FileTextOutlined },
  { name: 'FolderOutlined', label: '文件夹', aliases: ['folder'], Icon: FolderOutlined },
  { name: 'ContainerOutlined', label: '容器', aliases: ['container'], Icon: ContainerOutlined },
  { name: 'DatabaseOutlined', label: '数据库', aliases: ['database'], Icon: DatabaseOutlined },
  { name: 'CloudOutlined', label: '云', aliases: ['cloud'], Icon: CloudOutlined },
  { name: 'DesktopOutlined', label: '桌面', aliases: ['desktop'], Icon: DesktopOutlined },
  { name: 'ControlOutlined', label: '控制', aliases: ['control'], Icon: ControlOutlined },
  { name: 'ToolOutlined', label: '工具', aliases: ['tool'], Icon: ToolOutlined },
  { name: 'CalendarOutlined', label: '日历', aliases: ['calendar'], Icon: CalendarOutlined },
  { name: 'ScheduleOutlined', label: '日程', aliases: ['schedule'], Icon: ScheduleOutlined },
  { name: 'BellOutlined', label: '通知', aliases: ['bell'], Icon: BellOutlined },
  { name: 'NotificationOutlined', label: '公告', aliases: ['notification'], Icon: NotificationOutlined },
  { name: 'MailOutlined', label: '邮件', aliases: ['mail'], Icon: MailOutlined },
  { name: 'MessageOutlined', label: '消息', aliases: ['message'], Icon: MessageOutlined },
  { name: 'CommentOutlined', label: '评论', aliases: ['comment'], Icon: CommentOutlined },
  { name: 'TagsOutlined', label: '标签', aliases: ['tag', 'tags'], Icon: TagsOutlined },
  { name: 'BookOutlined', label: '知识库', aliases: ['book'], Icon: BookOutlined },
  { name: 'PictureOutlined', label: '图片', aliases: ['picture', 'image'], Icon: PictureOutlined },
  { name: 'InboxOutlined', label: '收件箱', aliases: ['inbox'], Icon: InboxOutlined },
  { name: 'PaperClipOutlined', label: '附件', aliases: ['paperclip', 'attach'], Icon: PaperClipOutlined },
  { name: 'SearchOutlined', label: '搜索', aliases: ['search'], Icon: SearchOutlined },
  { name: 'CompassOutlined', label: '导航', aliases: ['compass'], Icon: CompassOutlined },
  { name: 'GlobalOutlined', label: '全球', aliases: ['global', 'world'], Icon: GlobalOutlined },
  { name: 'CrownOutlined', label: '皇冠', aliases: ['crown'], Icon: CrownOutlined },
  { name: 'TrophyOutlined', label: '奖杯', aliases: ['trophy'], Icon: TrophyOutlined },
  { name: 'GiftOutlined', label: '礼物', aliases: ['gift'], Icon: GiftOutlined },
];

const BY_NAME = new Map(MENU_ICON_CATALOG.map((item) => [item.name.toLowerCase(), item]));
const BY_ALIAS = new Map<string, MenuIconItem>();
for (const item of MENU_ICON_CATALOG) {
  for (const alias of item.aliases) {
    BY_ALIAS.set(alias.toLowerCase(), item);
  }
}

const FALLBACK_BY_PATH: Record<string, string> = {
  '/home': 'DashboardOutlined',
  '/analytics': 'BarChartOutlined',
  '/assistant': 'RobotOutlined',
  '/campaigns': 'ProjectOutlined',
  '/creators': 'TeamOutlined',
  '/cooperations': 'SolutionOutlined',
  '/finance': 'WalletOutlined',
  '/finance/payment-requests': 'FileTextOutlined',
  '/finance/approvals': 'AuditOutlined',
  '/finance/payments': 'BankOutlined',
  '/system': 'SettingOutlined',
  '/system/user': 'UserOutlined',
  '/system/role': 'TeamOutlined',
  '/system/menu': 'MenuOutlined',
  '/system/dept': 'ApartmentOutlined',
  '/system/operate-log': 'AuditOutlined',
};

export function normalizePath(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

export function joinMenuPath(parentPath: string, path?: string | null): string {
  if (!path) return parentPath;
  if (path.startsWith('/')) return normalizePath(path);
  if (!parentPath) return normalizePath(path);
  return normalizePath(`${parentPath}/${path}`);
}

export type MenuPathNode = {
  path?: string | null;
  icon?: string | null;
  children?: MenuPathNode[];
};

export function collectMenuPaths(nodes: MenuPathNode[], parentPath = ''): Set<string> {
  const set = new Set<string>();
  for (const node of nodes) {
    const fullPath = joinMenuPath(parentPath, node.path);
    if (fullPath) set.add(fullPath);
    if (node.children?.length) {
      for (const childPath of collectMenuPaths(node.children, fullPath)) {
        set.add(childPath);
      }
    }
  }
  return set;
}

export function collectIconByPath(nodes: MenuPathNode[], parentPath = ''): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of nodes) {
    const fullPath = joinMenuPath(parentPath, node.path);
    if (fullPath && node.icon) {
      map.set(fullPath, node.icon);
    }
    if (node.children?.length) {
      for (const [key, value] of collectIconByPath(node.children, fullPath)) {
        map.set(key, value);
      }
    }
  }
  return map;
}

/** 把表单/数据库里的图标值收成目录中的标准名。未知值原样返回。 */
export function resolveMenuIconName(raw?: string | null): string | null {
  if (raw == null) return null;
  const key = raw.trim();
  if (!key) return null;
  const lower = key.toLowerCase();
  const found = BY_NAME.get(lower) || BY_ALIAS.get(lower);
  if (found) return found.name;
  return key;
}

export function getMenuIconItem(raw?: string | null): MenuIconItem | null {
  const name = resolveMenuIconName(raw);
  if (!name) return null;
  return BY_NAME.get(name.toLowerCase()) || null;
}

export function iconNameForMenuPath(path: string, backend: Map<string, string>): string | null {
  const normalized = normalizePath(path);
  const fromBackend = backend.get(normalized);
  if (fromBackend) return resolveMenuIconName(fromBackend);
  return FALLBACK_BY_PATH[normalized] || null;
}
