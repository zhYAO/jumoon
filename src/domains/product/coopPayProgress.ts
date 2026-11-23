import type { PrototypeCooperation, PrototypePayment } from './mockTypes';

/** 合作付款进度（从付款单推导，不是合作表字段） */
export type CoopPayProgress = 'none' | 'partial' | 'settled';

export const COOP_PAY_PROGRESS_LABEL: Record<CoopPayProgress, string> = {
  none: '未申请',
  partial: '部分付',
  settled: '已结清',
};

function usedAmount(coopId: string, payments: PrototypePayment[]) {
  return payments
    .filter(
      (p) =>
        p.cooperationId === coopId && ['pending', 'approved', 'paid'].includes(p.status),
    )
    .reduce((s, p) => s + p.amount, 0);
}

export function coopPayProgress(
  coop: PrototypeCooperation,
  payments: PrototypePayment[],
): CoopPayProgress {
  const used = usedAmount(coop.id, payments);
  if (used >= coop.creatorTotal) return 'settled';
  if (used <= 0) return 'none';
  return 'partial';
}
