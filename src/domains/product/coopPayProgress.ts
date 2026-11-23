import type { PrototypeCooperation, PrototypePayment } from './mockTypes';

/** 合作付款进度（从付款单推导，不是合作表字段） */
export type CoopPayProgress = 'none' | 'partial' | 'settled';

export const COOP_PAY_PROGRESS_LABEL: Record<CoopPayProgress, string> = {
  none: '未申请',
  partial: '部分付',
  settled: '已结清',
};

/** 待审、审核通过、已付款的金额均占用可申请额度。 */
export function indexCooperationPayments(payments: PrototypePayment[]) {
  const reservedByCooperation = new Map<string, number>();
  for (const { cooperationId, status, amount } of payments) {
    if (status === 'pending' || status === 'approved' || status === 'paid') {
      const reserved = reservedByCooperation.get(cooperationId) ?? 0;
      reservedByCooperation.set(cooperationId, reserved + amount);
    }
  }

  return (coop: PrototypeCooperation) => {
    const reserved = reservedByCooperation.get(coop.id) ?? 0;
    const remain = Math.max(0, coop.creatorTotal - reserved);
    const payProgress: CoopPayProgress =
      remain === 0 ? 'settled' : reserved > 0 ? 'partial' : 'none';
    return { remain, payProgress };
  };
}

export function coopPayProgress(coop: PrototypeCooperation, payments: PrototypePayment[]) {
  return indexCooperationPayments(payments)(coop).payProgress;
}
