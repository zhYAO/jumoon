import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { history, useLocation } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  COMPANY_USERS,
  ROLE_CURRENT_USER,
  type CampaignStatus,
  type PrototypeCampaign,
} from '@/domains/product/mockTypes';
import { createCampaignId, upsertCampaign, useMockStore } from '@/domains/product/mockStore';
import { campaignsForRole, canCreateCampaign } from '@/domains/product/permissions';
import {
  buildCampaignLedger,
  type CampaignLedger,
  type CostHealth,
  type ProfitHealth,
} from '@/domains/product/campaignLedger';
import {
  getPrototypeRole,
  getPrototypeRoleMeta,
  canRoleSeeModule,
} from '@/domains/product/prototypeNavigation';
import { getCampaignColumns } from './campaignColumns';
import { CampaignEditor } from './components/CampaignEditor';
import { toCampaignFormValues, toPrototypeCampaign, type CampaignFormValues } from './campaignForm';
import styles from './index.less';

const { Text, Title } = Typography;

export default function CampaignsPage() {
  const role = getPrototypeRole();
  const roleMeta = getPrototypeRoleMeta(role);
  const currentUser = ROLE_CURRENT_USER[role];
  const allowCreate = canCreateCampaign(role);
  const location = useLocation();
  const [form] = Form.useForm<CampaignFormValues>();
  const [editor, setEditor] = useState<{ campaign?: PrototypeCampaign }>();
  const editing = editor?.campaign;
  const { campaigns, cooperations, payments } = useMockStore();
  const visibleCampaigns = useMemo(
    () => campaignsForRole(campaigns, role, cooperations, payments),
    [campaigns, cooperations, payments, role],
  );
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
    const target = visibleCampaigns.find((c) => c.id === editId);
    if (!target || target.status !== 'draft') {
      history.replace('/campaigns');
      return;
    }
    setEditor({ campaign: target });
    history.replace('/campaigns');
  }, [allowCreate, visibleCampaigns, location.search]);

  useEffect(() => {
    if (role === 'operator' || role === 'owner' || role === 'business') setQuickView('mine');
    else if (role === 'finance') setQuickView('pay');
    else setQuickView('all');
  }, [role]);

  useEffect(() => {
    if (!editor) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue(toCampaignFormValues(editing));
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
  }, [currentUser, editing, editor, form, role]);

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

  const leaveEditor = () => {
    if (!form.isFieldsTouched()) {
      setEditor(undefined);
      return;
    }
    Modal.confirm({
      title: '离开创建页？',
      content: '尚未保存的修改会丢失。你也可以先保存为草稿。',
      okText: '确认离开',
      cancelText: '继续编辑',
      onOk: () => setEditor(undefined),
    });
  };

  const saveCampaign = (
    values: Partial<CampaignFormValues>,
    status: 'draft' | 'active',
  ) => {
    const now = new Date().toISOString();
    const campaign = toPrototypeCampaign(values, {
      id: editing?.id || createCampaignId(status),
      status,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
      defaultProjectOwner: currentUser,
    });
    upsertCampaign(campaign);
    message.success(
      status === 'draft'
        ? '草稿已保存'
        : '已发布并分配。被选中的运营可在「我的 Campaign」中看到该项目。',
    );
    setEditor(undefined);
  };

  const tableColumns = useMemo(() => {
    const editDraft = (campaign: PrototypeCampaign) => {
      setEditor({ campaign });
    };
    return getCampaignColumns(showMoney, allowCreate ? editDraft : undefined);
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

  return (
    <PageContainer
      className={`${styles.page} ${editor ? styles.isEditor : ''}`}
      title={editor ? (editing ? '编辑 Campaign 草稿' : '创建 Campaign') : '项目管理'}
      subTitle={
        editor
          ? '填写项目基础信息并分配运营'
          : '项目经营账：客户预算 / 目标成本 / 当前成本 / 利润 · 进度与风险'
      }
      tags={!editor ? <Tag color="green">第一期</Tag> : undefined}
      extra={
        editor ? (
          <Button icon={<ArrowLeftOutlined />} onClick={leaveEditor}>
            返回列表
          </Button>
        ) : (
          <Space>
            {allowCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditor({})}>
                创建 Campaign
              </Button>
            )}
          </Space>
        )
      }
    >
      {!editor ? (
        renderOverview()
      ) : (
        <CampaignEditor
          form={form}
          onCancel={leaveEditor}
          onSaveDraft={() => saveCampaign(form.getFieldsValue(true), 'draft')}
          onPublish={(values) => saveCampaign(values, 'active')}
        />
      )}
    </PageContainer>
  );
}
