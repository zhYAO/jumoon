import dayjs, { type Dayjs } from 'dayjs';
import type { CampaignBudgetType, PrototypeCampaign } from '@/domains/product/mockTypes';

export type CampaignFormValues = {
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

export const MIN_CAMPAIGN_BUDGET = 1;

const DEFAULT_CAMPAIGN_NAME = '未命名 Campaign';

export function toCampaignFormValues(campaign: PrototypeCampaign): CampaignFormValues {
  return {
    name: campaign.name === DEFAULT_CAMPAIGN_NAME ? undefined : campaign.name,
    clientBrand: campaign.clientBrand,
    settlementMonth: campaign.settlementMonth ? dayjs(`${campaign.settlementMonth}-01`) : undefined,
    budgetType: campaign.budgetType,
    clientBudget: campaign.clientBudget,
    targetCost: campaign.targetCost,
    currency: campaign.currency,
    markets: campaign.markets,
    platforms: campaign.platforms,
    period: campaign.startDate && campaign.endDate
      ? [dayjs(campaign.startDate), dayjs(campaign.endDate)]
      : undefined,
    projectOwner: campaign.projectOwner,
    businessOwner: campaign.businessOwner,
    operators: campaign.operators,
    brief: campaign.brief,
    productSku: campaign.productSku,
    languages: campaign.languages,
    creatorRequirements: campaign.creatorRequirements,
    targetCreators: campaign.targetCreators,
    targetContent: campaign.targetContent,
  };
}

type CampaignSaveContext = Pick<PrototypeCampaign, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
  defaultProjectOwner: string;
};

export function toPrototypeCampaign(
  values: Partial<CampaignFormValues>,
  { id, status, createdAt, updatedAt, defaultProjectOwner }: CampaignSaveContext,
): PrototypeCampaign {
  return {
    id,
    name: values.name?.trim() || DEFAULT_CAMPAIGN_NAME,
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
    projectOwner: values.projectOwner || defaultProjectOwner,
    businessOwner: values.businessOwner,
    operators: values.operators || [],
    brief: values.brief?.trim(),
    productSku: values.productSku?.trim(),
    languages: values.languages || [],
    creatorRequirements: values.creatorRequirements?.trim(),
    targetCreators: values.targetCreators,
    targetContent: values.targetContent,
    status,
    createdAt,
    updatedAt,
  };
}

export function publishChecks(values: Partial<CampaignFormValues>) {
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
      label: values.budgetType === 'fixed' ? '客户预算与内部目标成本' : '内部目标成本',
      passed:
        (values.targetCost ?? 0) >= MIN_CAMPAIGN_BUDGET &&
        (values.budgetType !== 'fixed' || (values.clientBudget ?? 0) >= MIN_CAMPAIGN_BUDGET),
    },
    { label: '项目负责人（BD）', passed: Boolean(values.projectOwner) },
    {
      label: '至少一位参与运营',
      passed: Boolean(values.operators?.length),
    },
  ];
}
