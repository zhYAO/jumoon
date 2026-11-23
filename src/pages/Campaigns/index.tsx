import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  SaveOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  BUSINESS_USERS,
  COMPANY_USERS,
  OPERATOR_USERS,
  ROLE_CURRENT_USER,
  type CampaignBudgetType,
  type CampaignStatus,
  type PrototypeCampaign,
} from '@/domains/product/mockTypes';
import { createCampaignId, upsertCampaign, useMockStore } from '@/domains/product/mockStore';
import { campaignsForRole, canCreateCampaign } from '@/domains/product/permissions';
import {
  buildCampaignLedger,
  moneyText,
  pctText,
  type CampaignLedger,
  type CostHealth,
  type ProfitHealth,
} from '@/domains/product/campaignLedger';
import {
  getPrototypeRole,
  getPrototypeRoleMeta,
  canRoleSeeModule,
} from '@/domains/product/prototypeNavigation';
import styles from './index.less';
import { history, useLocation } from '@umijs/max';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

type EditorMode = 'list' | 'editor';

type CampaignFormValues = {
  name?: string;
  clientBrand?: string;
  settlementMonth?: Dayjs;
  budgetType: CampaignBudgetType;
  clientBudget?: number;
  targetCost?: number;
  currency: PrototypeCampaign['currency'];
  markets?: string[];
  platforms?: string[];
  period?: [Dayjs, Dayjs];
  projectOwner?: string;
  businessOwner?: string;
  operators?: string[];
  brief?: string;
  productSku?: string;
  languages?: string[];
  creatorRequirements?: string;
  targetCreators?: number;
  targetContent?: number;
};

const MARKET_OPTIONS = ['美国', '加拿大', '英国', '德国', '法国', '澳大利亚', '东南亚'].map(
  (value) => ({ value, label: value }),
);
const PLATFORM_OPTIONS = ['TikTok', 'Instagram', 'YouTube', 'X'].map((value) => ({
  value,
  label: value,
}));
const LANGUAGE_OPTIONS = ['英语', '西班牙语', '法语', '德语', '中文'].map((value) => ({
  value,
  label: value,
}));
const CURRENCY_OPTIONS = ['USD', 'CNY', 'EUR', 'GBP'].map((value) => ({ value, label: value }));

function RequiredLabel({ children, help }: { children: ReactNode; help?: string }) {
  return (
    <span className={styles.fieldLabel}>
      <span className={styles.requiredMark}>*</span>
      {children}
      {help && (
        <Tooltip title={help}>
          <InfoCircleOutlined className={styles.helpIcon} />
        </Tooltip>
      )}
    </span>
  );
}

function OptionalLabel({ children }: { children: ReactNode }) {
  return (
    <span className={styles.fieldLabel}>
      {children}
      <span className={styles.optional}>选填</span>
    </span>
  );
}

function money(value?: number, currency = 'USD') {
  if (value === undefined || value === null) return '-';
  return `${currency} ${value.toLocaleString('en-US')}`;
}

function statusTag(status: CampaignStatus) {
  const config = {
    draft: { color: 'default', text: '草稿' },
    active: { color: 'processing', text: '执行中' },
    closed: { color: 'success', text: '已结束' },
  }[status];
  return <Tag color={config.color}>{config.text}</Tag>;
}

function publishChecks(values: Partial<CampaignFormValues>) {
  return [
    {
      label: '项目名称与客户 / 品牌',
      passed: Boolean(values.name?.trim() && values.clientBrand?.trim()),
    },
    { label: '结算月', passed: Boolean(values.settlementMonth) },
    {
      label: '市场与平台',
      passed: Boolean(values.markets?.length && values.platforms?.length),
    },
    {
      label:
        values.budgetType === 'fixed' ? '客户预算与内部目标成本' : '内部目标成本',
      passed: Boolean(
        values.targetCost &&
          values.targetCost > 0 &&
          (values.budgetType !== 'fixed' ||
            (values.clientBudget && values.clientBudget > 0)),
      ),
    },
    { label: '项目负责人（BD）', passed: Boolean(values.projectOwner) },
    {
      label: '至少一位参与运营',
      passed: Boolean(values.operators?.length),
    },
  ];
}

function readinessLabel(passed: number, total: number) {
  if (passed === total) return { text: '可发布', className: styles.statusReady };
  if (passed === 0) return { text: '草稿', className: styles.statusDraft };
  return { text: `缺 ${total - passed} 项`, className: styles.statusMissing };
}

export default function CampaignsPage() {
  const role = getPrototypeRole();
  const roleMeta = getPrototypeRoleMeta(role);
  const currentUser = ROLE_CURRENT_USER[role];
  const allowCreate = canCreateCampaign(role);
  const location = useLocation();
  const [form] = Form.useForm<CampaignFormValues>();
  const budgetType = Form.useWatch('budgetType', form) || 'open';
  const [mode, setMode] = useState<EditorMode>('list');
  const { campaigns, cooperations, payments } = useMockStore();
  const [editing, setEditing] = useState<PrototypeCampaign>();
  const [quickView, setQuickView] = useState<string>('all');
  const [filters, setFilters] = useState({
    keyword: '',
    brand: '',
    status: 'all' as 'all' | CampaignStatus,
    settlementMonth: '',
    owner: '',
    operator: '',
    costHealth: 'all' as 'all' | CostHealth,
    profitHealth: 'all' as 'all' | ProfitHealth,
    hasUnpaid: false,
    hasGap: false,
  });

  useEffect(() => {
    if (!canRoleSeeModule(role, '/campaigns')) {
      history.replace('/home');
    }
  }, [role]);

  useEffect(() => {
    const editId = new URLSearchParams(location.search).get('edit');
    if (!editId || !allowCreate) return;
    const target = campaigns.find((c) => c.id === editId);
    if (!target || target.status !== 'draft') {
      history.replace('/campaigns');
      return;
    }
    setEditing(target);
    setMode('editor');
    history.replace('/campaigns');
  }, [allowCreate, campaigns, location.search]);

  useEffect(() => {
    // 角色切换时重置快捷视图
    if (role === 'operator' || role === 'owner') setQuickView('mine');
    else if (role === 'finance') setQuickView('pay');
    else if (role === 'business') setQuickView('mine');
    else setQuickView('all');
  }, [role]);

  useEffect(() => {
    if (mode !== 'editor') return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        name: editing.name === '未命名 Campaign' ? undefined : editing.name,
        clientBrand: editing.clientBrand,
        settlementMonth: editing.settlementMonth
          ? dayjs(`${editing.settlementMonth}-01`)
          : undefined,
        budgetType: editing.budgetType,
        clientBudget: editing.clientBudget,
        targetCost: editing.targetCost,
        currency: editing.currency,
        markets: editing.markets,
        platforms: editing.platforms,
        period:
          editing.startDate && editing.endDate
            ? [dayjs(editing.startDate), dayjs(editing.endDate)]
            : undefined,
        projectOwner: editing.projectOwner,
        businessOwner: editing.businessOwner,
        operators: editing.operators,
        brief: editing.brief,
        productSku: editing.productSku,
        languages: editing.languages,
        creatorRequirements: editing.creatorRequirements,
        targetCreators: editing.targetCreators,
        targetContent: editing.targetContent,
      });
      return;
    }
    form.setFieldsValue({
      budgetType: 'open',
      currency: 'USD',
      projectOwner: COMPANY_USERS.some((user) => user.value === currentUser)
        ? currentUser
        : undefined,
      businessOwner: role === 'business' ? currentUser : 'Haylin',
      operators: [],
      markets: [],
      platforms: [],
      languages: ['英语'],
    });
  }, [currentUser, editing, form, mode, role]);

  const visibleCampaigns = useMemo(
    () => campaignsForRole(campaigns, role, cooperations, payments),
    [campaigns, cooperations, payments, role],
  );

  const ledgers = useMemo(
    () =>
      visibleCampaigns.map((c) => buildCampaignLedger(c, cooperations, payments)),
    [visibleCampaigns, cooperations, payments],
  );

  const showMoney = role !== 'operator' && role !== 'owner';

  const filteredLedgers = useMemo(() => {
    return ledgers.filter((row) => {
      const c = row.campaign;
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.keyword) {
        const q = filters.keyword.toLowerCase();
        if (!`${c.name}${c.id}`.toLowerCase().includes(q)) return false;
      }
      if (filters.brand && !c.clientBrand.includes(filters.brand)) return false;
      if (filters.settlementMonth && c.settlementMonth !== filters.settlementMonth) return false;
      if (filters.owner && c.projectOwner !== filters.owner) return false;
      if (filters.operator && !c.operators.includes(filters.operator)) return false;
      if (filters.costHealth !== 'all' && row.costHealth !== filters.costHealth) return false;
      if (filters.profitHealth !== 'all' && row.profitHealth !== filters.profitHealth) return false;
      if (filters.hasUnpaid && row.unpaidAmount <= 0) return false;
      if (filters.hasGap && row.creatorGap <= 0) return false;

      if (quickView === 'draft') return c.status === 'draft';
      if (quickView === 'active') return c.status === 'active';
      if (quickView === 'closed') return c.status === 'closed';
      if (quickView === 'gap') return c.status === 'active' && row.creatorGap > 0;
      if (quickView === 'costRisk') return row.costHealth === 'near' || row.costHealth === 'over';
      if (quickView === 'pay') return row.pendingReviewAmount > 0 || row.approvedUnpaidAmount > 0 || row.unpaidAmount > 0;
      if (quickView === 'risk') return row.risks.length > 0;
      if (quickView === 'lowProfit') return row.profitHealth === 'low' || row.profitHealth === 'loss';
      if (quickView === 'overCost') return row.costHealth === 'over';
      if (quickView === 'mine') {
        if (role === 'business') return c.businessOwner === currentUser || c.projectOwner === currentUser;
        return true;
      }
      return true;
    });
  }, [ledgers, filters, quickView, role, currentUser]);

  const listTitle =
    role === 'operator' || role === 'owner'
      ? '我的项目（执行）'
      : role === 'finance'
        ? '项目经营账（财务）'
        : role === 'business'
          ? '我的项目（经营）'
          : '项目经营列表';

  const quickOptions = useMemo(() => {
    if (role === 'operator' || role === 'owner') {
      return [
        { label: '我的项目', value: 'mine' },
        { label: '有目标缺口', value: 'gap' },
        { label: '成本风险', value: 'costRisk' },
        { label: '待申请/未付', value: 'pay' },
        { label: '进行中', value: 'active' },
      ];
    }
    if (role === 'finance') {
      return [
        { label: '待审/待付', value: 'pay' },
        { label: '进行中', value: 'active' },
        { label: '全部', value: 'all' },
      ];
    }
    if (role === 'business') {
      return [
        { label: '我的项目', value: 'mine' },
        { label: '草稿', value: 'draft' },
        { label: '进行中', value: 'active' },
        { label: '风险', value: 'risk' },
        { label: '全部', value: 'all' },
      ];
    }
    return [
      { label: '全部', value: 'all' },
      { label: '风险项目', value: 'risk' },
      { label: '低利润/亏损', value: 'lowProfit' },
      { label: '超成本', value: 'overCost' },
      { label: '进行中', value: 'active' },
      { label: '已结束', value: 'closed' },
    ];
  }, [role]);

  const startCreate = () => {
    setEditing(undefined);
    setMode('editor');
  };

  const startEdit = (campaign: PrototypeCampaign) => {
    setEditing(campaign);
    setMode('editor');
  };

  const leaveEditor = () => {
    if (!form.isFieldsTouched()) {
      setMode('list');
      setEditing(undefined);
      return;
    }
    Modal.confirm({
      title: '离开创建页？',
      content: '尚未保存的修改会丢失。你也可以先保存为草稿。',
      okText: '确认离开',
      cancelText: '继续编辑',
      onOk: () => {
        setMode('list');
        setEditing(undefined);
      },
    });
  };

  const buildCampaign = (
    values: Partial<CampaignFormValues>,
    status: CampaignStatus,
  ): PrototypeCampaign => {
    const now = new Date().toISOString();
    return {
      id: editing?.id || createCampaignId(status),
      name: values.name?.trim() || '未命名 Campaign',
      clientBrand: values.clientBrand?.trim() || '',
      settlementMonth: values.settlementMonth?.format('YYYY-MM') || '',
      budgetType: values.budgetType || 'fixed',
      clientBudget: values.budgetType === 'fixed' ? values.clientBudget : undefined,
      targetCost: values.targetCost,
      currency: values.currency || 'USD',
      markets: values.markets || [],
      platforms: values.platforms || [],
      startDate: values.period?.[0]?.format('YYYY-MM-DD'),
      endDate: values.period?.[1]?.format('YYYY-MM-DD'),
      projectOwner: values.projectOwner || currentUser,
      businessOwner: values.businessOwner,
      operators: values.operators || [],
      brief: values.brief?.trim(),
      productSku: values.productSku?.trim(),
      languages: values.languages || [],
      creatorRequirements: values.creatorRequirements?.trim(),
      targetCreators: values.targetCreators,
      targetContent: values.targetContent,
      status,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    };
  };

  const saveDraft = () => {
    const campaign = buildCampaign(form.getFieldsValue(true), 'draft');
    upsertCampaign(campaign);
    message.success('草稿已保存');
    setMode('list');
    setEditing(undefined);
  };

  const publishCampaign = async () => {
    try {
      const values = await form.validateFields([
        'name',
        'clientBrand',
        'settlementMonth',
        'markets',
        'platforms',
        'budgetType',
        'currency',
        'clientBudget',
        'targetCost',
        'projectOwner',
        'operators',
      ]);
      const campaign = buildCampaign(values, 'active');
      upsertCampaign(campaign);
      message.success(
        '已发布并分配。被选中的运营可在「我的 Campaign」中看到该项目。',
      );
      setMode('list');
      setEditing(undefined);
    } catch {
      message.warning('还有发布必填项未完成，请按右侧检查清单补齐');
    }
  };

  const tableColumns = useMemo(() => {
    const nameCol = {
      title: 'Campaign',
      key: 'campaign',
      width: 220,
      fixed: 'left' as const,
      render: (_: unknown, row: CampaignLedger) => (
        <button
          className={styles.campaignLink}
          type="button"
          onClick={() => history.push(`/campaigns/${row.campaign.id}`)}
        >
          <strong>{row.campaign.name}</strong>
          <span>
            {row.campaign.id} · {row.campaign.clientBrand || '客户待补充'}
          </span>
        </button>
      ),
    };

    const opsCols = [
      nameCol,
      {
        title: '进度',
        key: 'progress',
        width: 160,
        render: (_: unknown, row: CampaignLedger) => (
          <div className={styles.moneyCell}>
            <strong>
              {row.confirmedCreators}/{row.targetCreators || '—'}
            </strong>
            <small>还差 {row.creatorGap}</small>
          </div>
        ),
      },
      {
        title: '目标成本',
        key: 'target',
        width: 120,
        render: (_: unknown, row: CampaignLedger) =>
          moneyText(row.campaign.targetCost, row.campaign.currency),
      },
      {
        title: '已使用成本',
        key: 'used',
        width: 120,
        render: (_: unknown, row: CampaignLedger) => (
          <div className={styles.moneyCell}>
            <strong>{moneyText(row.projectCost, row.campaign.currency)}</strong>
            <small>{pctText(row.costUsageRate)} 占用</small>
          </div>
        ),
      },
      {
        title: '剩余成本',
        key: 'remain',
        width: 110,
        render: (_: unknown, row: CampaignLedger) =>
          moneyText(row.costRemain, row.campaign.currency),
      },
      {
        title: '当前阶段',
        key: 'stage',
        width: 130,
        render: (_: unknown, row: CampaignLedger) => row.stageLabel,
      },
      {
        title: '截止',
        key: 'end',
        width: 110,
        render: (_: unknown, row: CampaignLedger) => row.campaign.endDate || '—',
      },
      {
        title: '下一步',
        key: 'next',
        fixed: 'right' as const,
        width: 120,
        render: (_: unknown, row: CampaignLedger) => (
          <Button
            type="link"
            size="small"
            onClick={() => history.push(`/campaigns/${row.campaign.id}`)}
          >
            进入项目
          </Button>
        ),
      },
    ];

    const bizCols = [
      nameCol,
      {
        title: '状态',
        width: 90,
        render: (_: unknown, row: CampaignLedger) => statusTag(row.campaign.status),
      },
      {
        title: '项目进度',
        width: 150,
        render: (_: unknown, row: CampaignLedger) => (
          <div className={styles.moneyCell}>
            <strong>{row.progressLabel}</strong>
            <small>{row.stageLabel}</small>
          </div>
        ),
      },
      {
        title: '客户预算',
        width: 120,
        render: (_: unknown, row: CampaignLedger) =>
          row.campaign.budgetType === 'open' && row.clientMoney == null
            ? '开放预算'
            : moneyText(row.clientMoney, row.campaign.currency),
      },
      {
        title: '目标成本',
        width: 110,
        render: (_: unknown, row: CampaignLedger) =>
          moneyText(row.campaign.targetCost, row.campaign.currency),
      },
      {
        title: '当前成本',
        width: 110,
        render: (_: unknown, row: CampaignLedger) => (
          <div className={styles.moneyCell}>
            <strong>{moneyText(row.projectCost, row.campaign.currency)}</strong>
            <small>已确认合作</small>
          </div>
        ),
      },
      {
        title: '成本使用率',
        width: 100,
        render: (_: unknown, row: CampaignLedger) => pctText(row.costUsageRate),
      },
      {
        title: '预计利润',
        width: 110,
        render: (_: unknown, row: CampaignLedger) =>
          row.expectedProfit == null
            ? '待结算确认'
            : moneyText(row.expectedProfit, row.campaign.currency),
      },
      {
        title: '利润率',
        width: 80,
        render: (_: unknown, row: CampaignLedger) => pctText(row.profitRate),
      },
      {
        title: '已付 / 待付',
        width: 140,
        render: (_: unknown, row: CampaignLedger) => (
          <div className={styles.moneyCell}>
            <strong>{moneyText(row.paidAmount, row.campaign.currency)}</strong>
            <small>待付 {moneyText(row.unpaidAmount, row.campaign.currency)}</small>
          </div>
        ),
      },
      {
        title: '结算月',
        width: 90,
        render: (_: unknown, row: CampaignLedger) => row.campaign.settlementMonth || '—',
      },
      {
        title: '负责人',
        width: 90,
        render: (_: unknown, row: CampaignLedger) => row.campaign.projectOwner,
      },
      {
        title: '风险',
        width: 160,
        render: (_: unknown, row: CampaignLedger) =>
          row.risks.length ? (
            <Space size={[4, 4]} wrap>
              {row.risks.slice(0, 3).map((r) => (
                <Tag key={r} color={r.includes('超') || r.includes('亏') ? 'error' : 'warning'}>
                  {r}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: '下一步',
        key: 'next',
        fixed: 'right' as const,
        width: 130,
        render: (_: unknown, row: CampaignLedger) => (
          <Space size={0}>
            <Button
              type="link"
              size="small"
              onClick={() => history.push(`/campaigns/${row.campaign.id}`)}
            >
              进入项目
            </Button>
            {allowCreate && row.campaign.status === 'draft' && (
              <Button type="link" size="small" onClick={() => startEdit(row.campaign)}>
                编辑
              </Button>
            )}
          </Space>
        ),
      },
    ];

    return showMoney ? bizCols : opsCols;
  }, [showMoney, allowCreate]);

  const renderOverview = () => (
    <>
      <section className={styles.listSection}>
        <div className={styles.listToolbar}>
          <div>
            <Text className={styles.eyebrow}>{roleMeta.shortLabel} · 项目经营视图</Text>
            <Title level={4}>{listTitle}</Title>
            <Text type="secondary">
              当前成本 = 已确认合作金额合计（≠已付款）。利润 = 客户预算 − 当前成本。
            </Text>
          </div>
          <Segmented
            value={quickView}
            onChange={(v) => setQuickView(String(v))}
            options={quickOptions}
          />
        </div>

        <div className={styles.filterBar}>
          <Input
            allowClear
            placeholder="Campaign 名称 / ID"
            value={filters.keyword}
            onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
            style={{ width: 180 }}
          />
          <Input
            allowClear
            placeholder="客户 / 品牌"
            value={filters.brand}
            onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
            style={{ width: 140 }}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 120 }}
            value={filters.status === 'all' ? undefined : filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v || 'all' }))}
            options={[
              { value: 'draft', label: '草稿' },
              { value: 'active', label: '进行中' },
              { value: 'closed', label: '已结束' },
            ]}
          />
          <Select
            allowClear
            placeholder="结算月"
            style={{ width: 130 }}
            value={filters.settlementMonth || undefined}
            onChange={(v) => setFilters((f) => ({ ...f, settlementMonth: v || '' }))}
            options={Array.from(
              new Set(visibleCampaigns.map((c) => c.settlementMonth).filter(Boolean)),
            ).map((m) => ({ value: m, label: m }))}
          />
          {showMoney && (
            <>
              <Select
                allowClear
                placeholder="成本健康"
                style={{ width: 130 }}
                value={filters.costHealth === 'all' ? undefined : filters.costHealth}
                onChange={(v) => setFilters((f) => ({ ...f, costHealth: v || 'all' }))}
                options={[
                  { value: 'ok', label: '成本未超标' },
                  { value: 'near', label: '接近上限' },
                  { value: 'over', label: '已超标' },
                ]}
              />
              <Select
                allowClear
                placeholder="利润"
                style={{ width: 130 }}
                value={filters.profitHealth === 'all' ? undefined : filters.profitHealth}
                onChange={(v) => setFilters((f) => ({ ...f, profitHealth: v || 'all' }))}
                options={[
                  { value: 'positive', label: '正利润' },
                  { value: 'low', label: '低利润' },
                  { value: 'loss', label: '亏损风险' },
                ]}
              />
            </>
          )}
          <Select
            allowClear
            placeholder="负责人"
            style={{ width: 120 }}
            value={filters.owner || undefined}
            onChange={(v) => setFilters((f) => ({ ...f, owner: v || '' }))}
            options={COMPANY_USERS.map((u) => ({ value: u.value, label: u.value }))}
          />
          <Button
            type={filters.hasUnpaid ? 'primary' : 'default'}
            onClick={() => setFilters((f) => ({ ...f, hasUnpaid: !f.hasUnpaid }))}
          >
            有未付款
          </Button>
          <Button
            type={filters.hasGap ? 'primary' : 'default'}
            onClick={() => setFilters((f) => ({ ...f, hasGap: !f.hasGap }))}
          >
            有目标缺口
          </Button>
        </div>

        <Table<CampaignLedger>
          className={styles.table}
          rowKey={(r) => r.campaign.id}
          columns={tableColumns}
          dataSource={filteredLedgers}
          pagination={false}
          scroll={{ x: showMoney ? 1600 : 1100 }}
          locale={{
            emptyText:
              role === 'operator' || role === 'owner'
                ? '暂无分配给你的项目'
                : '暂无项目',
          }}
        />
      </section>
    </>
  );

  const renderEditor = () => (
    <Form<CampaignFormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.editorForm}
    >
      <div className={styles.editorShell}>
        <div className={styles.editorScroll}>
          <Alert
            className={styles.editorAlert}
            type="info"
            showIcon
            message="草稿可随时保存；发布时才会校验核心字段。"
          />
          <div className={styles.editorGrid}>
            <div className={styles.formSurface}>
          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <span>1</span><div><Title level={4}>项目身份</Title><Text>先把 Campaign 的归属与结算口径定下来</Text></div>
            </div>
            <Row gutter={[20, 0]}>
              <Col xs={24} lg={14}>
                <Form.Item
                  name="name"
                  label={<RequiredLabel>Campaign 名称</RequiredLabel>}
                  rules={[{ required: true, whitespace: true, message: '请输入 Campaign 名称' }]}
                >
                  <Input placeholder="例如：Luma US Back to School" maxLength={80} showCount />
                </Form.Item>
              </Col>
              <Col xs={24} lg={10}>
                <Form.Item
                  name="clientBrand"
                  label={<RequiredLabel>客户 / 品牌</RequiredLabel>}
                  rules={[{ required: true, whitespace: true, message: '请输入客户或品牌' }]}
                >
                  <Input placeholder="例如：Luma Beauty" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="settlementMonth"
                  label={<RequiredLabel help="用于财务归集，格式为 YYYY-MM">结算月</RequiredLabel>}
                  rules={[{ required: true, message: '请选择结算月' }]}
                >
                  <DatePicker picker="month" format="YYYY-MM" placeholder="选择结算月" className={styles.fullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="period" label={<OptionalLabel>执行周期</OptionalLabel>}>
                  <RangePicker className={styles.fullWidth} />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <span>2</span><div><Title level={4}>执行范围</Title><Text>明确市场、平台和内容语言</Text></div>
            </div>
            <Row gutter={[20, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="markets"
                  label={<RequiredLabel>市场</RequiredLabel>}
                  rules={[{ required: true, type: 'array', min: 1, message: '至少选择一个市场' }]}
                >
                  <Select mode="multiple" placeholder="选择市场" options={MARKET_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="platforms"
                  label={<RequiredLabel>平台</RequiredLabel>}
                  rules={[{ required: true, type: 'array', min: 1, message: '至少选择一个平台' }]}
                >
                  <Select mode="multiple" placeholder="选择平台" options={PLATFORM_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="languages" label={<OptionalLabel>内容语言</OptionalLabel>}>
                  <Select mode="multiple" placeholder="选择内容语言" options={LANGUAGE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="productSku" label={<OptionalLabel>产品 / SKU</OptionalLabel>}>
                  <Input placeholder="产品名称、套装或 SKU" />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <span>3</span><div><Title level={4}>预算与结算</Title><Text>预算口径会决定后续的成本控制方式</Text></div>
            </div>
            <Form.Item name="budgetType" label={<RequiredLabel>预算类型</RequiredLabel>}>
              <Radio.Group className={styles.budgetOptions}>
                <Radio value="fixed" className={styles.budgetOption}>
                  <div><strong>固定预算</strong><span>客户已确认总预算，需要录入客户预算</span></div>
                </Radio>
                <Radio value="open" className={styles.budgetOption}>
                  <div><strong>开放预算</strong><span>按执行逐步确认，只控制内部目标成本</span></div>
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Row gutter={[20, 0]}>
              <Col xs={24} md={8}>
                <Form.Item name="currency" label={<RequiredLabel>币种</RequiredLabel>} rules={[{ required: true }]}>
                  <Select options={CURRENCY_OPTIONS} />
                </Form.Item>
              </Col>
              {budgetType === 'fixed' && (
                <Col xs={24} md={8}>
                  <Form.Item
                    name="clientBudget"
                    label={<RequiredLabel>客户预算</RequiredLabel>}
                    rules={[{ required: true, type: 'number', min: 1, message: '请输入客户预算' }]}
                  >
                    <InputNumber min={0} precision={2} className={styles.fullWidth} placeholder="0.00" />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} md={budgetType === 'fixed' ? 8 : 16}>
                <Form.Item
                  name="targetCost"
                  label={<RequiredLabel help="参与运营可以查看，但只有项目管理角色可以修改">内部目标成本</RequiredLabel>}
                  rules={[{ required: true, type: 'number', min: 1, message: '请输入内部目标成本' }]}
                >
                  <InputNumber min={0} precision={2} className={styles.fullWidth} placeholder="团队执行成本上限" />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <span>4</span>
              <div>
                <Title level={4}>人员分配</Title>
                <Text>负责人默认当前用户，可改；参与运营从公司用户中选择</Text>
              </div>
            </div>
            <Row gutter={[20, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="projectOwner"
                  label={
                    <RequiredLabel help="默认当前用户，可从公司用户中调整">
                      项目负责人 Owner
                    </RequiredLabel>
                  }
                  rules={[{ required: true, message: '请选择项目负责人（BD）' }]}
                >
                  <Select
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    placeholder="选择项目负责人"
                    options={COMPANY_USERS}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="businessOwner" label={<OptionalLabel>商务负责人</OptionalLabel>}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={BUSINESS_USERS}
                    placeholder="默认当前商务"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="operators"
                  label={
                    <RequiredLabel help="草稿可空；发布时至少一位。发布后自动进入对方「我的 Campaign」">
                      参与运营
                    </RequiredLabel>
                  }
                  rules={[
                    {
                      required: true,
                      type: 'array',
                      min: 1,
                      message: '发布前至少选择一位参与运营',
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    showSearch
                    optionFilterProp="label"
                    placeholder="选择公司运营人员"
                    options={OPERATOR_USERS}
                    suffixIcon={<TeamOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <span>5</span>
              <div>
                <Title level={4}>Brief 与达人要求</Title>
                <Text>选填；不影响草稿保存与发布校验</Text>
              </div>
            </div>
            <Form.Item name="brief" label={<OptionalLabel>客户 Brief</OptionalLabel>}>
              <Input.TextArea
                rows={4}
                placeholder="背景、核心信息、内容方向、禁忌事项和交付要求"
                maxLength={1200}
                showCount
              />
            </Form.Item>
            <Form.Item name="creatorRequirements" label={<OptionalLabel>达人画像要求</OptionalLabel>}>
              <Input.TextArea
                rows={3}
                placeholder="粉丝、均播、类目、地区或排除条件"
                maxLength={600}
                showCount
              />
            </Form.Item>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionTitle}>
              <span>6</span>
              <div>
                <Title level={4}>执行目标</Title>
                <Text>一期可空，用于后续目标 vs 实际对比</Text>
              </div>
            </div>
            <Row gutter={[20, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="targetCreators" label={<OptionalLabel>目标达人数</OptionalLabel>}>
                  <InputNumber min={0} precision={0} className={styles.fullWidth} placeholder="0" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="targetContent" label={<OptionalLabel>目标内容条数</OptionalLabel>}>
                  <InputNumber min={0} precision={0} className={styles.fullWidth} placeholder="0" />
                </Form.Item>
              </Col>
            </Row>
          </section>
        </div>

        <Form.Item noStyle shouldUpdate>
          {({ getFieldsValue }) => {
            const values = getFieldsValue(true) as Partial<CampaignFormValues>;
            const checks = publishChecks(values);
            const passed = checks.filter((item) => item.passed).length;
            const percent = Math.round((passed / checks.length) * 100);
            const ready = readinessLabel(passed, checks.length);
            return (
              <aside className={styles.publishPanel}>
                <div className={styles.publishPanelHead}>
                  <div>
                    <Text className={styles.eyebrow}>项目摘要</Text>
                    <Title level={4}>实时预览</Title>
                  </div>
                  <Progress type="circle" percent={percent} size={54} strokeWidth={9} />
                </div>
                <div className={styles.summaryList}>
                  <div className={styles.summaryRow}>
                    <span className={styles.k}>项目名称</span>
                    <span className={styles.v}>{values.name?.trim() || '—'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.k}>客户 / 品牌</span>
                    <span className={styles.v}>{values.clientBrand?.trim() || '—'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.k}>结算月</span>
                    <span className={styles.v}>
                      {values.settlementMonth
                        ? dayjs(values.settlementMonth).format('YYYY-MM')
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.k}>预算类型</span>
                    <span className={styles.v}>
                      {values.budgetType === 'fixed' ? '固定预算' : '开放预算'}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.k}>内部目标成本</span>
                    <span className={styles.v}>
                      {values.targetCost != null
                        ? money(values.targetCost, values.currency || 'USD')
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.k}>参与运营</span>
                    <span className={styles.v}>
                      {values.operators?.length ? values.operators.join('、') : '未分配'}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.k}>当前状态</span>
                    <span className={`${styles.v} ${ready.className}`}>{ready.text}</span>
                  </div>
                </div>
                <Text className={styles.eyebrow} style={{ marginBottom: 8 }}>
                  发布检查
                </Text>
                <div className={styles.checkList}>
                  {checks.map((item) => (
                    <div className={item.passed ? styles.checkPassed : ''} key={item.label}>
                      {item.passed ? <CheckCircleFilled /> : <ClockCircleOutlined />}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.permissionNote}>
                  <InfoCircleOutlined />
                  <div>
                    <strong>发布后的权限</strong>
                    <span>
                      运营可查看内部目标成本但不可改；财务仅在有合作/付款后看到该项目。
                    </span>
                  </div>
                </div>
              </aside>
            );
          }}
        </Form.Item>
          </div>
        </div>

        <div className={styles.editorFooter}>
          <Button onClick={leaveEditor}>取消</Button>
          <div>
            <Button icon={<SaveOutlined />} onClick={saveDraft}>
              保存草稿
            </Button>
            <Button type="primary" icon={<RocketOutlined />} onClick={publishCampaign}>
              发布并分配
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );

  return (
    <PageContainer
      className={`${styles.page} ${mode === 'editor' ? styles.isEditor : ''}`}
      title={mode === 'editor' ? (editing ? '编辑 Campaign 草稿' : '创建 Campaign') : '项目管理'}
      subTitle={
        mode === 'editor'
          ? '填写项目基础信息并分配运营'
          : '项目经营账：客户预算 / 目标成本 / 当前成本 / 利润 · 进度与风险'
      }
      tags={mode === 'list' ? <Tag color="green">第一期</Tag> : undefined}
      extra={
        mode === 'editor' ? (
          <Button icon={<ArrowLeftOutlined />} onClick={leaveEditor}>
            返回列表
          </Button>
        ) : (
          <Space>
            {allowCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>
                创建 Campaign
              </Button>
            )}
          </Space>
        )
      }
    >
      {mode === 'list' ? renderOverview() : renderEditor()}
    </PageContainer>
  );
}
