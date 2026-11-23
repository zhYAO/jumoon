import type { PaymentStatus, PaymentType } from '@/domains/product/mockTypes';

export const STATUS_TAG: Record<PaymentStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'blue', text: '审核通过' },
  paid: { color: 'success', text: '已付款' },
  rejected: { color: 'error', text: '驳回' },
  need_info: { color: 'gold', text: '信息补充' },
};

export const TYPE_LABEL: Record<PaymentType, string> = {
  deposit: '订金',
  balance: '尾款',
  full: '全款',
};

export const PAYMENT_TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export type PaymentStatusFilter = 'all' | PaymentStatus;

type PaymentView = {
  title: string;
  subtitle: string;
  path: string;
  defaultStatus: PaymentStatusFilter;
  statusOptions: { label: string; value: PaymentStatusFilter }[];
};

const applicationStatuses: PaymentView['statusOptions'] = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已付款', value: 'paid' },
  { label: '驳回', value: 'rejected' },
  { label: '待补充', value: 'need_info' },
];

type PageKind = 'requests' | 'approvals' | 'records';

export function pageKind(pathname: string): PageKind {
  if (pathname.includes('/approvals')) return 'approvals';
  if (pathname.includes('/payment-requests')) return 'requests';
  return 'records';
}

export const PAYMENT_VIEWS: Record<PageKind, PaymentView> = {
  requests: {
    title: '付款申请',
    subtitle: '运营对已确认合作发起付款',
    path: '/finance/payment-requests',
    defaultStatus: 'all',
    statusOptions: applicationStatuses,
  },
  approvals: {
    title: '财务审批',
    subtitle: '审运营提交的付款 · 通过后可标记已付',
    path: '/finance/approvals',
    defaultStatus: 'pending',
    statusOptions: applicationStatuses,
  },
  records: {
    title: '付款记录',
    subtitle: '已付与历史记录',
    path: '/finance/payments',
    defaultStatus: 'paid',
    statusOptions: [
      { label: '已付款', value: 'paid' },
      { label: '全部', value: 'all' },
      { label: '已通过待付', value: 'approved' },
    ],
  },
};
