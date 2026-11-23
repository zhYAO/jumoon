import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_MOCK_STATE } from '@/domains/product/mockSeed';
import { getMockState, resetMockStore, upsertCampaign } from '@/domains/product/mockStore';
import { MOCK_STORAGE_KEY } from '@/domains/product/mockTypes';
import { campaignsForRole, canCreateCampaign } from '@/domains/product/permissions';

describe('campaign prototype rules', () => {
  beforeEach(() => {
    window.localStorage.removeItem(MOCK_STORAGE_KEY);
    resetMockStore();
  });

  it('运营只看到已发布且分配给自己的 Campaign', () => {
    const visible = campaignsForRole(
      INITIAL_MOCK_STATE.campaigns,
      'operator',
      INITIAL_MOCK_STATE.cooperations,
      INITIAL_MOCK_STATE.payments,
    );

    expect(visible.map((campaign) => campaign.id)).toEqual(['JM-2026-0812']);
    expect(visible.every((campaign) => campaign.status === 'active')).toBe(true);
    expect(visible.every((campaign) => campaign.operators.includes('Iris'))).toBe(true);
  });

  it('财务只看到已有 Cooperation 或 Payment 的 Campaign', () => {
    const visible = campaignsForRole(
      INITIAL_MOCK_STATE.campaigns,
      'finance',
      INITIAL_MOCK_STATE.cooperations,
      INITIAL_MOCK_STATE.payments,
    );

    expect(visible.map((campaign) => campaign.id)).toEqual([
      'JM-2026-0812',
      'JM-2026-0821',
    ]);
  });

  it('运营与财务不能创建，商务、Owner 和老板可以创建', () => {
    expect(canCreateCampaign('operator')).toBe(false);
    expect(canCreateCampaign('finance')).toBe(false);
    expect(canCreateCampaign('business')).toBe(true);
    expect(canCreateCampaign('owner')).toBe(true);
    expect(canCreateCampaign('executive')).toBe(true);
  });

  it('Campaign 草稿和发布结果写入统一 mock 仓库', () => {
    const campaign = {
      ...INITIAL_MOCK_STATE.campaigns[0],
      id: 'JM-DRAFT-TEST',
      name: '测试草稿',
      status: 'draft' as const,
    };

    upsertCampaign(campaign);

    expect(getMockState().campaigns[0]).toEqual(campaign);
    const persisted = JSON.parse(window.localStorage.getItem(MOCK_STORAGE_KEY) || '{}');
    expect(persisted.campaigns[0]).toEqual(campaign);
  });
});
