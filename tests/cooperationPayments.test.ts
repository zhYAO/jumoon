import { describe, expect, it } from 'vitest';
import { buildCampaignRecordList } from '@/domains/product/campaignRecordList';
import { indexCooperationPayments } from '@/domains/product/coopPayProgress';
import { INITIAL_MOCK_STATE } from '@/domains/product/mockSeed';
import {
  canCreateCooperation,
  cooperationsForPaymentApplication,
  cooperationsForRole,
  paymentsForRole,
} from '@/domains/product/permissions';

const { campaigns, cooperations, payments } = INITIAL_MOCK_STATE;
const [inOwnedProject, , unrelated] = cooperations;
const personallyHandled = { ...unrelated, id: 'owned-cooperation', operator: 'Eddy' };
const records = [personallyHandled, inOwnedProject, unrelated];

describe('cooperation payment permissions', () => {
  it('商务可建合作，财务不可建，两个角色均不可申请付款', () => {
    expect(canCreateCooperation('business')).toBe(true);
    expect(canCreateCooperation('finance')).toBe(false);
    expect(cooperationsForPaymentApplication(records, campaigns, 'business')).toEqual([]);
    expect(cooperationsForPaymentApplication(records, campaigns, 'finance')).toEqual([]);
  });

  it('Owner 在合作列表与付款表单均能看到本人经办或本人负责项目的合作', () => {
    const expected = [personallyHandled, inOwnedProject];
    expect(cooperationsForRole(records, campaigns, 'owner', payments)).toEqual(expected);
    expect(cooperationsForPaymentApplication(records, campaigns, 'owner')).toEqual(expected);
    const applications = records.map((coop) => ({
      ...payments[0],
      cooperationId: coop.id,
      campaignId: coop.campaignId,
      operator: coop.operator,
    }));
    expect(paymentsForRole(applications, 'owner', campaigns)).toEqual(applications.slice(0, 2));
  });

  it('运营只可为本人经办的合作申请，老板可为全部合作申请', () => {
    expect(cooperationsForPaymentApplication(records, campaigns, 'operator')).toEqual([
      inOwnedProject,
    ]);
    expect(cooperationsForPaymentApplication(records, campaigns, 'executive')).toEqual(records);
  });
});

describe('cooperation payment summary', () => {
  it('按合作分别累计待审、已通过和已付，不计入驳回及待补充', () => {
    const template = { ...payments[0], cooperationId: inOwnedProject.id, amount: 10 };
    const statuses = ['pending', 'approved', 'paid', 'rejected', 'need_info'] as const;
    const summary = indexCooperationPayments([
      ...statuses.map((status) => ({ ...template, status })),
      { ...template, cooperationId: unrelated.id, amount: unrelated.creatorTotal + 1 },
    ]);

    expect(summary(inOwnedProject)).toEqual({
      remain: inOwnedProject.creatorTotal - 30,
      payProgress: 'partial',
    });
    expect(summary(unrelated)).toEqual({ remain: 0, payProgress: 'settled' });
    expect(summary(personallyHandled)).toEqual({
      remain: personallyHandled.creatorTotal,
      payProgress: 'none',
    });
  });

  it('额度恰好用尽及零金额合作均沿用已结清状态', () => {
    expect(indexCooperationPayments(payments)(inOwnedProject)).toEqual({
      remain: 0,
      payProgress: 'settled',
    });
    expect(indexCooperationPayments([])({ ...inOwnedProject, creatorTotal: 0 })).toEqual({
      remain: 0,
      payProgress: 'settled',
    });
  });
});

describe('campaign record list', () => {
  it('筛选仅包含可见记录，项目按原顺序，找不到项目时显示 ID', () => {
    const missing = { ...inOwnedProject, campaignId: 'missing' };
    const list = buildCampaignRecordList([unrelated, inOwnedProject, missing], campaigns);

    expect(list.rows.map((row) => row.campaignName)).toEqual([
      campaigns[1].name,
      campaigns[0].name,
      'missing',
    ]);
    expect(list.campaignOptions.map((option) => option.value)).toEqual([
      campaigns[0].id,
      campaigns[1].id,
    ]);
    expect(list.brandOptions.map((option) => option.value)).toEqual([
      campaigns[1].clientBrand,
      campaigns[0].clientBrand,
    ]);
    expect(list.creatorOptions).toHaveLength(2);
  });
});
