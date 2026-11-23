import type { PrototypeRole } from './prototypeNavigation';

export type CampaignStatus = 'draft' | 'active' | 'closed';
export type CampaignBudgetType = 'fixed' | 'open';
export type PaymentStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'need_info';
export type PaymentType = 'deposit' | 'balance' | 'full';
export type PaymentMode = 'full' | 'deposit_balance';

export type PrototypeCampaign = {
  id: string;
  name: string;
  clientBrand: string;
  settlementMonth: string;
  budgetType: CampaignBudgetType;
  clientBudget?: number;
  targetCost?: number;
  currency: 'USD' | 'CNY' | 'EUR' | 'GBP';
  markets: string[];
  platforms: string[];
  startDate?: string;
  endDate?: string;
  projectOwner: string;
  businessOwner?: string;
  operators: string[];
  brief?: string;
  productSku?: string;
  languages: string[];
  creatorRequirements?: string;
  targetCreators?: number;
  targetContent?: number;
  /** 开放预算结项时填写的客户最终结算金额 */
  finalSettlementAmount?: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
};

export type PrototypeCreator = {
  id: string;
  name: string;
  country: string;
  account: string;
  email?: string;
  payoutMethod?: string;
  payoutAccount?: string;
  createdBy: string;
  createdAt: string;
};

export type CoopLine = {
  key: string;
  platform: string;
  product?: string;
  type?: string;
  qty: number;
  creatorAmt: number;
  clientQuote: number;
};

export type PrototypeCooperation = {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  country: string;
  operator: string;
  currency: string;
  paymentMode: PaymentMode;
  depositAmount: number;
  creatorTotal: number;
  clientQuote: number;
  lines: CoopLine[];
  createdAt: string;
};

export type PrototypePayment = {
  id: string;
  cooperationId: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  operator: string;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  clientQuote: number;
  payoutMethod: string;
  internalPayer: string;
  payoutAccount: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type MockState = {
  campaigns: PrototypeCampaign[];
  creators: PrototypeCreator[];
  cooperations: PrototypeCooperation[];
  payments: PrototypePayment[];
};

export const MOCK_STORAGE_KEY = 'jumoon.prototype.mock.v4';

export const ROLE_CURRENT_USER: Record<PrototypeRole, string> = {
  architecture: '超级管理员',
  business: 'Haylin',
  owner: 'Eddy',
  operator: 'Iris',
  finance: 'Coco',
  executive: 'Alex',
};

export const COMPANY_USERS = [
  { value: 'Haylin', label: 'Haylin · 商务', role: 'business' },
  { value: 'Alex', label: 'Alex · 老板', role: 'executive' },
  { value: 'Eddy', label: 'Eddy · 运营 BD', role: 'operator' },
  { value: 'Iris', label: 'Iris · 运营 BD', role: 'operator' },
  { value: 'Mia', label: 'Mia · 运营 BD', role: 'operator' },
  { value: 'Coco', label: 'Coco · 财务', role: 'finance' },
];

export const OPERATOR_USERS = COMPANY_USERS.filter((u) => u.role === 'operator');
export const BUSINESS_USERS = COMPANY_USERS.filter((u) => u.role === 'business');

export const CHART_COLORS = {
  primary: '#3478c9',
  success: '#0c6f65',
  warning: '#f79009',
  muted: '#98a2b3',
  danger: '#f04438',
};
