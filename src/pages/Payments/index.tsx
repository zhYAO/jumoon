import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { ROLE_CURRENT_USER } from '@/domains/product/mockTypes';
import type { PaymentStatus, PaymentType, PrototypePayment } from '@/domains/product/mockTypes';
import {
  addPayment,
  paymentRemain,
  updatePaymentStatus,
  useMockStore,
} from '@/domains/product/mockStore';
import {
  canReviewPayment,
  canSeePayoutAccount,
  maskAccount,
  paymentsForRole,
} from '@/domains/product/permissions';
import { getPrototypeRole, canRoleSeeModule } from '@/domains/product/prototypeNavigation';
import styles from './index.less';

const { Text } = Typography;

const STATUS_TAG: Record<PaymentStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'blue', text: '审核通过' },
  paid: { color: 'success', text: '已付款' },
  rejected: { color: 'error', text: '驳回' },
  need_info: { color: 'gold', text: '信息补充' },
};

const TYPE_LABEL: Record<PaymentType, string> = {
  deposit: '订金',
  balance: '尾款',
  full: '全款',
};

function money(v?: number, c = 'USD') {
  return v == null ? '-' : `${c} ${v.toLocaleString('en-US')}`;
}

type PageKind = 'requests' | 'approvals' | 'records';

function pageKind(pathname: string): PageKind {
  if (pathname.includes('/approvals')) return 'approvals';
  if (pathname.includes('/payment-requests')) return 'requests';
  return 'records';
}

function titleFromKind(kind: PageKind) {
  if (kind === 'approvals') return '财务审批';
  if (kind === 'requests') return '付款申请';
  return '付款记录';
}

function subtitleFromKind(kind: PageKind) {
  if (kind === 'approvals') return '审运营提交的付款 · 通过后可标记已付';
  if (kind === 'requests') return '运营对已确认合作发起付款';
  return '已付与历史记录';
}

const emptyFilters = {
  keyword: '',
  campaignId: 'all',
  brand: 'all',
  operator: 'all',
  creatorId: 'all',
  paymentType: 'all' as 'all' | PaymentType,
  payoutMethod: 'all',
};

export default function PaymentsPage() {
  const role = getPrototypeRole();
  const me = ROLE_CURRENT_USER[role];
  const location = useLocation();
  const kind = pageKind(location.pathname);
  const { campaigns, cooperations, payments, creators } = useMockStore();
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>(
    kind === 'approvals' ? 'pending' : kind === 'records' ? 'paid' : 'all',
  );
  const [filters, setFilters] = useState(emptyFilters);
  const [applyOpen, setApplyOpen] = useState(false);
  const [form] = Form.useForm();

  const showOperatorFilter = role !== 'operator';
  const canApply =
    kind === 'requests' &&
    ['operator', 'owner', 'business', 'executive', 'architecture'].includes(role);
  const canReview = kind === 'approvals' && canReviewPayment(role);

  useEffect(() => {
    if (kind === 'approvals' && !canRoleSeeModule(role, '/finance/approvals')) {
      history.replace(
        canRoleSeeModule(role, '/finance/payment-requests')
          ? '/finance/payment-requests'
          : '/finance/payments',
      );
      return;
    }
    if (kind === 'requests' && !canRoleSeeModule(role, '/finance/payment-requests')) {
      history.replace(
        canRoleSeeModule(role, '/finance/approvals')
          ? '/finance/approvals'
          : '/finance/payments',
      );
      return;
    }

    setStatusFilter(kind === 'approvals' ? 'pending' : kind === 'records' ? 'paid' : 'all');
    setFilters(emptyFilters);

    const params = new URLSearchParams(location.search);
    const coopId = params.get('coop');
    if (coopId && kind === 'requests') {
      const coop = cooperations.find((c) => c.id === coopId);
      if (coop) {
        form.setFieldsValue({
          cooperationId: coop.id,
          paymentType: coop.paymentMode === 'full' ? 'full' : 'deposit',
          amount: paymentRemain(coop, payments) || undefined,
          payoutMethod: creators.find((c) => c.id === coop.creatorId)?.payoutMethod || 'PayPal',
          internalPayer: '美国财务',
          payoutAccount: creators.find((c) => c.id === coop.creatorId)?.payoutAccount,
        });
        setApplyOpen(true);
      }
    }
  }, [location.pathname, location.search, role, kind]);

  const baseList = useMemo(
    () => paymentsForRole(payments, role, campaigns),
    [campaigns, payments, role],
  );

  const enriched = useMemo(
    () =>
      baseList.map((p) => {
        const camp = campaigns.find((c) => c.id === p.campaignId);
        return {
          ...p,
          campaignName: camp?.name || p.campaignId,
          brand: camp?.clientBrand || '',
        };
      }),
    [baseList, campaigns],
  );

  const campaignOptions = useMemo(() => {
    const ids = new Set(enriched.map((r) => r.campaignId));
    return campaigns
      .filter((c) => ids.has(c.id))
      .map((c) => ({ value: c.id, label: c.name }));
  }, [enriched, campaigns]);

  const brandOptions = useMemo(() => {
    const set = new Set(enriched.map((r) => r.brand).filter(Boolean));
    return Array.from(set).map((b) => ({ value: b, label: b }));
  }, [enriched]);

  const operatorOptions = useMemo(() => {
    const set = new Set(enriched.map((r) => r.operator).filter(Boolean));
    return Array.from(set).map((o) => ({ value: o, label: o }));
  }, [enriched]);

  const creatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    enriched.forEach((r) => map.set(r.creatorId, r.creatorName));
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [enriched]);

  const payoutMethodOptions = useMemo(() => {
    const set = new Set(enriched.map((r) => r.payoutMethod).filter(Boolean));
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [enriched]);

  const filteredList = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return enriched.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (filters.campaignId !== 'all' && r.campaignId !== filters.campaignId) return false;
      if (filters.brand !== 'all' && r.brand !== filters.brand) return false;
      if (filters.operator !== 'all' && r.operator !== filters.operator) return false;
      if (filters.creatorId !== 'all' && r.creatorId !== filters.creatorId) return false;
      if (filters.paymentType !== 'all' && r.paymentType !== filters.paymentType) return false;
      if (filters.payoutMethod !== 'all' && r.payoutMethod !== filters.payoutMethod) return false;
      if (kw) {
        const hay =
          `${r.id} ${r.campaignName} ${r.brand} ${r.creatorName} ${r.operator} ${r.payoutAccount}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [enriched, filters, statusFilter]);

  const myCoops = useMemo(() => {
    if (['finance', 'executive', 'architecture'].includes(role)) return cooperations;
    return cooperations.filter((c) => c.operator === me);
  }, [cooperations, me, role]);

  const submitApply = async () => {
    const v = await form.validateFields();
    const coop = cooperations.find((c) => c.id === v.cooperationId);
    if (!coop) return message.error('请选择合作');
    const rem = paymentRemain(coop, payments);
    if (v.amount <= 0 || v.amount > rem) return message.error(`金额须在 0 ~ ${rem} 之间`);
    addPayment({
      cooperationId: coop.id,
      campaignId: coop.campaignId,
      creatorId: coop.creatorId,
      creatorName: coop.creatorName,
      operator: coop.operator,
      paymentType: v.paymentType,
      amount: Number(v.amount),
      currency: coop.currency,
      clientQuote: coop.clientQuote,
      payoutMethod: v.payoutMethod,
      internalPayer: v.internalPayer,
      payoutAccount: v.payoutAccount || '',
      status: 'pending',
    });
    message.success('付款申请已提交');
    setApplyOpen(false);
    form.resetFields();
    history.replace('/finance/payment-requests');
  };

  const review = (row: PrototypePayment, status: PaymentStatus) => {
    if (row.operator === me && role === 'operator') {
      return message.warning('不能审核自己的申请');
    }
    updatePaymentStatus(row.id, status);
    message.success('已更新状态');
  };

  const statusOptions =
    kind === 'approvals'
      ? [
          { label: '全部', value: 'all' },
          { label: '待审核', value: 'pending' },
          { label: '已通过', value: 'approved' },
          { label: '已付款', value: 'paid' },
          { label: '驳回', value: 'rejected' },
          { label: '待补充', value: 'need_info' },
        ]
      : kind === 'records'
        ? [
            { label: '已付款', value: 'paid' },
            { label: '全部', value: 'all' },
            { label: '已通过待付', value: 'approved' },
          ]
        : [
            { label: '全部', value: 'all' },
            { label: '待审核', value: 'pending' },
            { label: '已通过', value: 'approved' },
            { label: '已付款', value: 'paid' },
            { label: '驳回', value: 'rejected' },
            { label: '待补充', value: 'need_info' },
          ];

  return (
    <PageContainer
      title={titleFromKind(kind)}
      subTitle={subtitleFromKind(kind)}
      extra={
        canApply ? (
          <Button type="primary" onClick={() => setApplyOpen(true)}>
            发起付款申请
          </Button>
        ) : null
      }
    >
      <Segmented
        style={{ marginBottom: 12 }}
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as typeof statusFilter)}
        options={statusOptions}
      />

      <div className={styles.filterBar}>
        <Input
          allowClear
          placeholder="搜申请号 / 项目 / 达人 / 运营"
          style={{ width: 220 }}
          value={filters.keyword}
          onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
        />
        <Select
          style={{ width: 200 }}
          value={filters.campaignId}
          onChange={(v) => setFilters((f) => ({ ...f, campaignId: v }))}
          options={[{ value: 'all', label: '全部项目' }, ...campaignOptions]}
        />
        <Select
          style={{ width: 140 }}
          value={filters.brand}
          onChange={(v) => setFilters((f) => ({ ...f, brand: v }))}
          options={[{ value: 'all', label: '全部品牌' }, ...brandOptions]}
        />
        {showOperatorFilter && (
          <Select
            style={{ width: 120 }}
            value={filters.operator}
            onChange={(v) => setFilters((f) => ({ ...f, operator: v }))}
            options={[{ value: 'all', label: '全部运营' }, ...operatorOptions]}
          />
        )}
        <Select
          style={{ width: 140 }}
          value={filters.creatorId}
          onChange={(v) => setFilters((f) => ({ ...f, creatorId: v }))}
          options={[{ value: 'all', label: '全部达人' }, ...creatorOptions]}
        />
        <Select
          style={{ width: 110 }}
          value={filters.paymentType}
          onChange={(v) => setFilters((f) => ({ ...f, paymentType: v }))}
          options={[
            { value: 'all', label: '全部类型' },
            { value: 'deposit', label: '订金' },
            { value: 'balance', label: '尾款' },
            { value: 'full', label: '全款' },
          ]}
        />
        <Select
          style={{ width: 120 }}
          value={filters.payoutMethod}
          onChange={(v) => setFilters((f) => ({ ...f, payoutMethod: v }))}
          options={[{ value: 'all', label: '全部渠道' }, ...payoutMethodOptions]}
        />
        <Button onClick={() => setFilters(emptyFilters)}>重置</Button>
      </div>

      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        当前 {filteredList.length} 条
        {role === 'operator' ? '（仅自己的申请）' : ''}
      </Text>

      <Table
        rowKey="id"
        dataSource={filteredList}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '申请号', dataIndex: 'id', width: 100 },
          { title: '达人', dataIndex: 'creatorName', width: 110 },
          {
            title: '项目',
            key: 'campaign',
            render: (_, r) => (
              <div className={styles.cellStack}>
                <strong>{r.campaignName}</strong>
                {r.brand ? <span>{r.brand}</span> : null}
              </div>
            ),
          },
          ...(showOperatorFilter
            ? [{ title: '运营', dataIndex: 'operator' as const, width: 90 }]
            : []),
          {
            title: '类型',
            dataIndex: 'paymentType',
            width: 80,
            render: (t: PaymentType) => TYPE_LABEL[t] || t,
          },
          { title: '金额', render: (_, r) => money(r.amount, r.currency), width: 120 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s: PaymentStatus) => (
              <Tag color={STATUS_TAG[s].color}>{STATUS_TAG[s].text}</Tag>
            ),
          },
          {
            title: '渠道',
            dataIndex: 'payoutMethod',
            width: 90,
          },
          {
            title: '收款账号',
            dataIndex: 'payoutAccount',
            render: (v, r) =>
              canSeePayoutAccount(role, r.operator) ? v || '-' : maskAccount(v),
          },
          {
            title: '操作',
            width: 220,
            fixed: 'right' as const,
            render: (_, r) =>
              canReview && r.status === 'pending' ? (
                <Space size={4}>
                  <Button size="small" type="link" onClick={() => review(r, 'approved')}>
                    通过
                  </Button>
                  <Button size="small" type="link" onClick={() => review(r, 'need_info')}>
                    补充
                  </Button>
                  <Button size="small" type="link" danger onClick={() => review(r, 'rejected')}>
                    驳回
                  </Button>
                </Space>
              ) : canReview && r.status === 'approved' ? (
                <Button size="small" type="link" onClick={() => review(r, 'paid')}>
                  标记已付
                </Button>
              ) : (
                '-'
              ),
          },
        ]}
      />

      <Drawer
        title="发起付款申请"
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setApplyOpen(false)}>取消</Button>
            <Button type="primary" onClick={submitApply}>
              提交
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="cooperationId" label="合作" rules={[{ required: true }]}>
            <Select
              options={myCoops.map((c) => ({
                value: c.id,
                label: `${c.id} · ${c.creatorName} · 剩余 ${paymentRemain(c, payments)}`,
              }))}
              onChange={(id) => {
                const coop = cooperations.find((c) => c.id === id);
                if (!coop) return;
                const cr = creators.find((c) => c.id === coop.creatorId);
                form.setFieldsValue({
                  amount: paymentRemain(coop, payments),
                  payoutMethod: cr?.payoutMethod || 'PayPal',
                  payoutAccount: cr?.payoutAccount,
                });
              }}
            />
          </Form.Item>
          <Form.Item name="paymentType" label="付款类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'deposit', label: '订金' },
                { value: 'balance', label: '尾款' },
                { value: 'full', label: '全款' },
              ]}
            />
          </Form.Item>
          <Form.Item name="amount" label="本次金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonBefore="$" />
          </Form.Item>
          <Form.Item name="payoutMethod" label="付款渠道" rules={[{ required: true }]}>
            <Select
              options={['PayPal', 'Wise', 'Bank', 'Zelle'].map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>
          <Form.Item name="internalPayer" label="内部付款人" rules={[{ required: true }]}>
            <Select
              options={['美国财务', '冰姐', '国内财务'].map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>
          <Form.Item name="payoutAccount" label="达人收款账号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </PageContainer>
  );
}
