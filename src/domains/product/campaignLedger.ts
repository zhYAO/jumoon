import type {
  PrototypeCampaign,
  PrototypeCooperation,
  PrototypePayment,
} from './mockTypes';

export type CostHealth = 'ok' | 'near' | 'over';
export type ProfitHealth = 'positive' | 'low' | 'loss' | 'unknown';
export type RiskFlag =
  | '超成本'
  | '接近成本上限'
  | '亏损风险'
  | '低利润'
  | '有未付款'
  | '有待审核'
  | '目标缺口'
  | '临期';

export type CampaignLedger = {
  campaign: PrototypeCampaign;
  /** 当前成本：已确认达人合作金额合计（≠已付款） */
  projectCost: number;
  /** 财务已支付 */
  paidAmount: number;
  /** 待审金额 */
  pendingReviewAmount: number;
  /** 已通过待付 */
  approvedUnpaidAmount: number;
  /** 当前成本 - 已付款 */
  unpaidAmount: number;
  /** 目标成本 - 当前成本 */
  costRemain: number | null;
  costUsageRate: number | null;
  costHealth: CostHealth;
  /** 固定：客户预算；开放：最终结算金额（未填则无） */
  clientMoney: number | null;
  clientMoneyLabel: string;
  expectedProfit: number | null;
  profitRate: number | null;
  profitHealth: ProfitHealth;
  targetCreators: number;
  confirmedCreators: number;
  creatorGap: number;
  progressLabel: string;
  risks: RiskFlag[];
  stageLabel: string;
};

function coopsOf(campaignId: string, cooperations: PrototypeCooperation[]) {
  return cooperations.filter((c) => c.campaignId === campaignId);
}

function paysOf(campaignId: string, payments: PrototypePayment[]) {
  return payments.filter((p) => p.campaignId === campaignId);
}

export function buildCampaignLedger(
  campaign: PrototypeCampaign,
  cooperations: PrototypeCooperation[],
  payments: PrototypePayment[],
): CampaignLedger {
  const coops = coopsOf(campaign.id, cooperations);
  const pays = paysOf(campaign.id, payments);

  const projectCost = coops.reduce((s, c) => s + (c.creatorTotal || 0), 0);
  const paidAmount = pays
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);
  const pendingReviewAmount = pays
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0);
  const approvedUnpaidAmount = pays
    .filter((p) => p.status === 'approved')
    .reduce((s, p) => s + p.amount, 0);
  const unpaidAmount = Math.max(0, projectCost - paidAmount);

  const target = campaign.targetCost ?? null;
  const costRemain = target == null ? null : target - projectCost;
  const costUsageRate =
    target && target > 0 ? projectCost / target : null;

  let costHealth: CostHealth = 'ok';
  if (costUsageRate != null) {
    if (costUsageRate > 1) costHealth = 'over';
    else if (costUsageRate >= 0.85) costHealth = 'near';
  }

  let clientMoney: number | null = null;
  let clientMoneyLabel = '开放预算';
  if (campaign.budgetType === 'fixed') {
    clientMoney = campaign.clientBudget ?? null;
    clientMoneyLabel = '客户预算';
  } else if (campaign.finalSettlementAmount != null) {
    clientMoney = campaign.finalSettlementAmount;
    clientMoneyLabel = '客户最终结算';
  }

  let expectedProfit: number | null = null;
  let profitRate: number | null = null;
  let profitHealth: ProfitHealth = 'unknown';
  if (clientMoney != null) {
    expectedProfit = clientMoney - projectCost;
    profitRate = clientMoney > 0 ? expectedProfit / clientMoney : null;
    if (expectedProfit < 0) profitHealth = 'loss';
    else if (profitRate != null && profitRate < 0.2) profitHealth = 'low';
    else profitHealth = 'positive';
  }

  const targetCreators = campaign.targetCreators || 0;
  const confirmedCreators = new Set(coops.map((c) => c.creatorId)).size;
  const creatorGap = Math.max(0, targetCreators - confirmedCreators);
  const progressLabel =
    targetCreators > 0
      ? `名额 ${confirmedCreators}/${targetCreators} · 还差 ${creatorGap}`
      : `已确认 ${confirmedCreators} 人（未设目标）`;

  const risks: RiskFlag[] = [];
  if (costHealth === 'over') risks.push('超成本');
  else if (costHealth === 'near') risks.push('接近成本上限');
  if (profitHealth === 'loss') risks.push('亏损风险');
  else if (profitHealth === 'low') risks.push('低利润');
  if (unpaidAmount > 0) risks.push('有未付款');
  if (pendingReviewAmount > 0) risks.push('有待审核');
  if (targetCreators > 0 && creatorGap > 0 && campaign.status === 'active') {
    risks.push('目标缺口');
  }
  if (campaign.endDate) {
    const end = new Date(campaign.endDate).getTime();
    const now = Date.now();
    const days = (end - now) / (1000 * 3600 * 24);
    if (days < 0 && campaign.status === 'active') risks.push('临期');
    else if (days >= 0 && days <= 14 && campaign.status === 'active') risks.push('临期');
  }

  const stageLabel =
    campaign.status === 'draft'
      ? '草稿'
      : campaign.status === 'closed'
        ? '已结束'
        : creatorGap > 0
          ? '执行中·补人'
          : unpaidAmount > 0
            ? '执行中·待付清'
            : '执行中·可收尾';

  return {
    campaign,
    projectCost,
    paidAmount,
    pendingReviewAmount,
    approvedUnpaidAmount,
    unpaidAmount,
    costRemain,
    costUsageRate,
    costHealth,
    clientMoney,
    clientMoneyLabel,
    expectedProfit,
    profitRate,
    profitHealth,
    targetCreators,
    confirmedCreators,
    creatorGap,
    progressLabel,
    risks,
    stageLabel,
  };
}

export function moneyText(value?: number | null, currency = 'USD') {
  if (value === undefined || value === null) return '—';
  return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function pctText(rate?: number | null) {
  if (rate === undefined || rate === null || Number.isNaN(rate)) return '—';
  return `${(rate * 100).toFixed(0)}%`;
}
