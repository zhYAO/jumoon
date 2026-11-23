import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import {
  Button,
  Input,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildCampaignRecordList, textOptions } from '@/domains/product/campaignRecordList';
import { ROLE_CURRENT_USER } from '@/domains/product/mockTypes';
import type { PaymentStatus, PaymentType, PrototypePayment } from '@/domains/product/mockTypes';
import {
  updatePaymentStatus,
  useMockStore,
} from '@/domains/product/mockStore';
import {
  canApplyPayment,
  canReviewPayment,
  canSeePayoutAccount,
  maskAccount,
  paymentsForRole,
} from '@/domains/product/permissions';
import { getPrototypeRole, canRoleSeeModule, defaultFinancePathForRole } from '@/domains/product/prototypeNavigation';
import { PaymentApplicationDrawer } from './PaymentApplicationDrawer';
import { pageKind, PAYMENT_TYPE_OPTIONS, PAYMENT_VIEWS, STATUS_TAG, TYPE_LABEL, type PaymentStatusFilter } from './paymentViews';
import styles from './index.less';

const { Text } = Typography;

function money(v?: number, c = 'USD') {
  return v == null ? '-' : `${c} ${v.toLocaleString('en-US')}`;
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
  const view = PAYMENT_VIEWS[kind];
  const { campaigns, payments } = useMockStore();
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>(view.defaultStatus);
  const [filters, setFilters] = useState(emptyFilters);
  const [applyOpen, setApplyOpen] = useState(false);
  const requestedCoopId = new URLSearchParams(location.search).get('coop');

  const showOperatorFilter = role !== 'operator';
  const canApply = kind === 'requests' && canApplyPayment(role);
  const canReview = kind === 'approvals' && canReviewPayment(role);

  useEffect(() => {
    if (!canRoleSeeModule(role, view.path)) {
      history.replace(defaultFinancePathForRole(role));
      return;
    }
    setStatusFilter(view.defaultStatus);
    setFilters(emptyFilters);
    setApplyOpen(false);
  }, [role, view]);

  const closeApplication = useCallback(() => {
    setApplyOpen(false);
    if (requestedCoopId) history.replace(view.path);
  }, [requestedCoopId, view]);

  const baseList = useMemo(
    () => paymentsForRole(payments, role, campaigns),
    [campaigns, payments, role],
  );

  const { rows, campaignOptions, brandOptions, operatorOptions, creatorOptions } = useMemo(
    () => buildCampaignRecordList(baseList, campaigns),
    [baseList, campaigns],
  );
  const payoutMethodOptions = useMemo(() => textOptions(rows.map((r) => r.payoutMethod)), [rows]);

  const filteredList = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return rows.filter((r) => {
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
  }, [rows, filters, statusFilter]);

  const review = (row: PrototypePayment, status: PaymentStatus) => {
    if (row.operator === me && role === 'operator') {
      return message.warning('不能审核自己的申请');
    }
    updatePaymentStatus(row.id, status);
    message.success('已更新状态');
  };

  return (
    <PageContainer
      title={view.title}
      subTitle={view.subtitle}
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
        options={view.statusOptions}
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
            ...PAYMENT_TYPE_OPTIONS,
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

      {canApply && (
        <PaymentApplicationDrawer
          role={role}
          open={applyOpen || Boolean(requestedCoopId)}
          requestedCoopId={requestedCoopId}
          onClose={closeApplication}
          key={role + ':' + (requestedCoopId ?? '')}
        />
      )}
    </PageContainer>
  );
}
