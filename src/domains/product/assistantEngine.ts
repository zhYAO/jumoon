import {
  buildCampaignLedger,
  moneyText,
  pctText,
  type CampaignLedger,
} from './campaignLedger';
import { COOP_PAY_PROGRESS_LABEL, indexCooperationPayments } from './coopPayProgress';
import type {
  PrototypeCampaign,
  PrototypeCooperation,
  PrototypePayment,
} from './mockTypes';
import {
  campaignsForRole,
  cooperationsForRole,
  paymentsForRole,
} from './permissions';
import type { PrototypeRole } from './prototypeNavigation';

export type AssistantAction = {
  label: string;
  path: string;
};

export type AssistantAnswer = {
  title: string;
  summary: string;
  bullets: string[];
  actions: AssistantAction[];
  /** 注明数据边界，便于演示说明 */
  note: string;
};

export type AssistantPrompt = {
  id: string;
  label: string;
  hint?: string;
};

export function assistantTitleForRole(role: PrototypeRole) {
  if (role === 'executive' || role === 'architecture') return 'AI 管家 · 看板助手';
  if (role === 'finance') return 'AI 管家 · 财务';
  if (role === 'business') return 'AI 管家 · 商务';
  return 'AI 管家 · 运营';
}

/** 页面顶栏定位文案（全角色共用） */
export const ASSISTANT_POSITIONING = {
  headline: '基于你权限的全局管家',
  body: '不只看数：在你权限范围内，帮你理解业务、串起项目 → 合作 → 付款等复杂流程，并指引（后续可代操作）到该处理的一步。你看不见的数据，管家也碰不到。',
};

export function promptsForRole(role: PrototypeRole): AssistantPrompt[] {
  if (role === 'finance') {
    return [
      { id: 'FIN-01', label: '待审队列摘要', hint: '笔数与金额' },
      { id: 'FIN-02', label: '按运营拆待审', hint: '谁提交的多' },
      { id: 'FIN-03', label: '按项目看待付', hint: '已通过未付' },
      { id: 'FIN-05', label: '已付回顾', hint: '已付款合计' },
    ];
  }
  if (role === 'executive' || role === 'architecture') {
    return [
      { id: 'EXE-01', label: '经营总览', hint: '预算 / 成本 / 利润' },
      { id: 'EXE-02', label: '超成本与近上限', hint: '风险项目' },
      { id: 'EXE-03', label: '低利润风险', hint: '利润率偏低' },
      { id: 'EXE-04', label: '钱卡在哪', hint: '待审 / 待付' },
    ];
  }
  if (role === 'business') {
    return [
      { id: 'BIZ-01', label: '我的项目状态', hint: '草稿 / 执行中' },
      { id: 'BIZ-02', label: '我的经营摘要', hint: '预算与利润' },
      { id: 'EXE-04', label: '相关付款卡住吗', hint: '待审待付' },
    ];
  }
  // operator / owner
  return [
    { id: 'OPS-01', label: '今日待办摘要', hint: '项目与付款' },
    { id: 'OPS-02', label: '名额缺口提醒', hint: '还差几人' },
    { id: 'OPS-03', label: '成本预警', hint: '接近目标成本' },
    { id: 'OPS-04', label: '可申请付款清单', hint: '未结清合作' },
  ];
}

function ledgersFor(
  role: PrototypeRole,
  campaigns: PrototypeCampaign[],
  cooperations: PrototypeCooperation[],
  payments: PrototypePayment[],
) {
  const visible = campaignsForRole(campaigns, role, cooperations, payments);
  return visible.map((c) => buildCampaignLedger(c, cooperations, payments));
}

export function runAssistantPrompt(
  promptId: string,
  role: PrototypeRole,
  campaigns: PrototypeCampaign[],
  cooperations: PrototypeCooperation[],
  payments: PrototypePayment[],
): AssistantAnswer {
  const ledgers = ledgersFor(role, campaigns, cooperations, payments);
  const coops = cooperationsForRole(cooperations, campaigns, role, payments);
  const pays = paymentsForRole(payments, role, campaigns);
  const note = '基于你的权限 · 内部数据 · 管家只在授权范围内分析与指引流程';

  switch (promptId) {
    case 'OPS-01':
      return opsToday(ledgers, coops, pays, note);
    case 'OPS-02':
      return opsGaps(ledgers, note);
    case 'OPS-03':
      return opsCostRisk(ledgers, note);
    case 'OPS-04':
      return opsPayable(coops, pays, campaigns, note);
    case 'FIN-01':
      return finPending(pays, note);
    case 'FIN-02':
      return finByOperator(pays, note);
    case 'FIN-03':
      return finByCampaign(pays, campaigns, note);
    case 'FIN-05':
      return finPaid(pays, note);
    case 'EXE-01':
      return exeOverview(ledgers, pays, note);
    case 'EXE-02':
      return exeCostRisk(ledgers, note);
    case 'EXE-03':
      return exeProfitRisk(ledgers, note);
    case 'EXE-04':
      return exeCashStuck(pays, note);
    case 'BIZ-01':
      return bizStatus(ledgers, note);
    case 'BIZ-02':
      return exeOverview(ledgers, pays, note);
    default:
      return {
        title: '未识别的问题',
        summary: '请点上方预设问题。',
        bullets: [],
        actions: [{ label: '回工作台', path: '/home' }],
        note,
      };
  }
}

function opsToday(
  ledgers: CampaignLedger[],
  coops: PrototypeCooperation[],
  pays: PrototypePayment[],
  note: string,
): AssistantAnswer {
  const active = ledgers.filter((l) => l.campaign.status === 'active');
  const gap = active.filter((l) => l.creatorGap > 0).length;
  const paymentSummary = indexCooperationPayments(pays);
  const payable = coops.filter((coop) => paymentSummary(coop).remain > 0).length;
  const myPending = pays.filter((p) => p.status === 'pending').length;
  return {
    title: '今日待办摘要',
    summary: `你有 ${active.length} 个执行中项目；其中 ${gap} 个还有名额缺口；${payable} 笔合作还可申请付款；${myPending} 笔申请在待审。`,
    bullets: active.slice(0, 5).map(
      (l) =>
        `${l.campaign.name}：${l.progressLabel} · 当前成本 ${moneyText(l.projectCost, l.campaign.currency)}`,
    ),
    actions: [
      { label: '我的项目', path: '/campaigns' },
      { label: '合作管理', path: '/cooperations' },
      { label: '付款申请', path: '/finance/payment-requests' },
    ],
    note,
  };
}

function opsGaps(ledgers: CampaignLedger[], note: string): AssistantAnswer {
  const rows = ledgers
    .filter((l) => l.campaign.status === 'active' && l.creatorGap > 0)
    .sort((a, b) => b.creatorGap - a.creatorGap);
  return {
    title: '名额缺口提醒',
    summary: rows.length
      ? `共 ${rows.length} 个项目未凑齐目标达人。`
      : '当前可见项目没有名额缺口（或未设目标人数）。',
    bullets: rows.slice(0, 8).map(
      (l) =>
        `${l.campaign.name}：已确认 ${l.confirmedCreators}/${l.targetCreators}，还差 ${l.creatorGap}`,
    ),
    actions: [
      { label: '去项目列表', path: '/campaigns' },
      { label: '去建合作', path: '/cooperations' },
    ],
    note,
  };
}

function opsCostRisk(ledgers: CampaignLedger[], note: string): AssistantAnswer {
  const rows = ledgers.filter((l) => l.costHealth === 'near' || l.costHealth === 'over');
  return {
    title: '成本预警',
    summary: rows.length
      ? `${rows.length} 个项目接近或超过内部目标成本。`
      : '暂无接近/超过目标成本的项目。',
    bullets: rows.map(
      (l) =>
        `${l.campaign.name}：占用 ${pctText(l.costUsageRate)} · 当前 ${moneyText(l.projectCost, l.campaign.currency)} / 目标 ${moneyText(l.campaign.targetCost, l.campaign.currency)}`,
    ),
    actions: [{ label: '看项目', path: '/campaigns' }],
    note: note + ' · 运营仅看目标成本与当前成本，不含客户利润',
  };
}

function opsPayable(
  coops: PrototypeCooperation[],
  pays: PrototypePayment[],
  campaigns: PrototypeCampaign[],
  note: string,
): AssistantAnswer {
  const paymentSummary = indexCooperationPayments(pays);
  const rows = coops.filter((coop) => paymentSummary(coop).remain > 0);
  return {
    title: '可申请付款清单',
    summary: rows.length
      ? `${rows.length} 笔合作尚未结清，可继续申请付款。`
      : '可见合作均已结清或暂无可付余额。',
    bullets: rows.slice(0, 8).map((c) => {
      const name = campaigns.find((x) => x.id === c.campaignId)?.name || c.campaignId;
      const { payProgress } = paymentSummary(c);
      return `${c.creatorName} · ${name} · ${COOP_PAY_PROGRESS_LABEL[payProgress]} · 合作额 ${moneyText(c.creatorTotal, c.currency)}`;
    }),
    actions: [
      { label: '合作管理', path: '/cooperations' },
      { label: '发起付款', path: '/finance/payment-requests' },
    ],
    note,
  };
}

function finPending(pays: PrototypePayment[], note: string): AssistantAnswer {
  const rows = pays.filter((p) => p.status === 'pending');
  const sum = rows.reduce((s, p) => s + p.amount, 0);
  return {
    title: '待审队列摘要',
    summary: `待审核 ${rows.length} 笔，合计 ${moneyText(sum)}。`,
    bullets: rows.slice(0, 8).map(
      (p) =>
        `${p.id} · ${p.creatorName} · ${p.operator} · ${moneyText(p.amount, p.currency)}`,
    ),
    actions: [{ label: '去财务审批', path: '/finance/approvals' }],
    note,
  };
}

function finByOperator(pays: PrototypePayment[], note: string): AssistantAnswer {
  const pending = pays.filter((p) => p.status === 'pending');
  const map = new Map<string, { count: number; amount: number }>();
  pending.forEach((p) => {
    const cur = map.get(p.operator) || { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += p.amount;
    map.set(p.operator, cur);
  });
  const rows = Array.from(map.entries()).sort((a, b) => b[1].amount - a[1].amount);
  return {
    title: '按运营拆待审',
    summary: rows.length ? `待审来自 ${rows.length} 位运营。` : '当前无待审。',
    bullets: rows.map(
      ([op, v]) => `${op}：${v.count} 笔 · ${moneyText(v.amount)}`,
    ),
    actions: [{ label: '按运营筛选审批', path: '/finance/approvals' }],
    note,
  };
}

function finByCampaign(
  pays: PrototypePayment[],
  campaigns: PrototypeCampaign[],
  note: string,
): AssistantAnswer {
  const rows = pays.filter((p) => p.status === 'approved');
  const map = new Map<string, number>();
  rows.forEach((p) => map.set(p.campaignId, (map.get(p.campaignId) || 0) + p.amount));
  const list = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  return {
    title: '按项目看待付',
    summary: list.length
      ? `${list.length} 个项目有「已通过待付」金额。`
      : '暂无已通过待付。',
    bullets: list.map(([id, amt]) => {
      const name = campaigns.find((c) => c.id === id)?.name || id;
      return `${name}：${moneyText(amt)}`;
    }),
    actions: [{ label: '去标记已付', path: '/finance/approvals' }],
    note,
  };
}

function finPaid(pays: PrototypePayment[], note: string): AssistantAnswer {
  const rows = pays.filter((p) => p.status === 'paid');
  const sum = rows.reduce((s, p) => s + p.amount, 0);
  return {
    title: '已付回顾',
    summary: `已付款 ${rows.length} 笔，合计 ${moneyText(sum)}。`,
    bullets: rows.slice(0, 8).map(
      (p) => `${p.id} · ${p.creatorName} · ${moneyText(p.amount, p.currency)}`,
    ),
    actions: [{ label: '付款记录', path: '/finance/payments' }],
    note,
  };
}

function exeOverview(
  ledgers: CampaignLedger[],
  pays: PrototypePayment[],
  note: string,
): AssistantAnswer {
  const client = ledgers.reduce((s, l) => s + (l.clientMoney || 0), 0);
  const cost = ledgers.reduce((s, l) => s + l.projectCost, 0);
  const profit = ledgers.reduce((s, l) => s + (l.expectedProfit || 0), 0);
  const paid = pays.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = pays.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  return {
    title: '经营总览',
    summary: `客户侧可计 ${moneyText(client)} · 当前成本 ${moneyText(cost)} · 预计利润 ${moneyText(profit)}。已付 ${moneyText(paid)}，待审 ${moneyText(pending)}。`,
    bullets: [
      `纳入统计项目 ${ledgers.length} 个（开放预算未结算的利润未计入）`,
      `成本/利润来自「已确认合作」，不等于银行已付`,
    ],
    actions: [
      { label: '打开看板', path: '/analytics' },
      { label: '项目管理', path: '/campaigns' },
    ],
    note,
  };
}

function exeCostRisk(ledgers: CampaignLedger[], note: string): AssistantAnswer {
  const rows = ledgers.filter((l) => l.costHealth === 'over' || l.costHealth === 'near');
  return {
    title: '超成本与近上限',
    summary: rows.length ? `需关注 ${rows.length} 个项目。` : '暂无成本风险项目。',
    bullets: rows.map(
      (l) =>
        `${l.costHealth === 'over' ? '【超】' : '【近】'}${l.campaign.name} · ${pctText(l.costUsageRate)}`,
    ),
    actions: [{ label: '项目列表', path: '/campaigns' }],
    note,
  };
}

function exeProfitRisk(ledgers: CampaignLedger[], note: string): AssistantAnswer {
  const rows = ledgers.filter(
    (l) => l.profitHealth === 'loss' || l.profitHealth === 'low',
  );
  return {
    title: '低利润风险',
    summary: rows.length
      ? `${rows.length} 个项目利润偏低或亏损风险。`
      : '在可计算利润的项目里，暂无明显低利润项。',
    bullets: rows.map(
      (l) =>
        `${l.campaign.name} · 预计利润 ${moneyText(l.expectedProfit, l.campaign.currency)} · 利润率 ${pctText(l.profitRate)}`,
    ),
    actions: [{ label: '看经营账', path: '/campaigns' }],
    note,
  };
}

function exeCashStuck(pays: PrototypePayment[], note: string): AssistantAnswer {
  const pending = pays.filter((p) => p.status === 'pending');
  const approved = pays.filter((p) => p.status === 'approved');
  const pSum = pending.reduce((s, p) => s + p.amount, 0);
  const aSum = approved.reduce((s, p) => s + p.amount, 0);
  return {
    title: '钱卡在哪',
    summary: `待审 ${pending.length} 笔 ${moneyText(pSum)}；已通过待付 ${approved.length} 笔 ${moneyText(aSum)}。`,
    bullets: [
      ...pending.slice(0, 4).map((p) => `待审 ${p.id} · ${p.creatorName} · ${moneyText(p.amount, p.currency)}`),
      ...approved.slice(0, 4).map((p) => `待付 ${p.id} · ${p.creatorName} · ${moneyText(p.amount, p.currency)}`),
    ],
    actions: [
      { label: '财务审批', path: '/finance/approvals' },
      { label: '付款记录', path: '/finance/payments' },
    ],
    note,
  };
}

function bizStatus(ledgers: CampaignLedger[], note: string): AssistantAnswer {
  const draft = ledgers.filter((l) => l.campaign.status === 'draft').length;
  const active = ledgers.filter((l) => l.campaign.status === 'active').length;
  return {
    title: '我的项目状态',
    summary: `草稿 ${draft} 个 · 执行中 ${active} 个。`,
    bullets: ledgers.slice(0, 8).map(
      (l) => `${l.campaign.name} · ${l.stageLabel} · ${l.progressLabel}`,
    ),
    actions: [
      { label: '项目管理', path: '/campaigns' },
      { label: '创建项目', path: '/campaigns' },
    ],
    note,
  };
}
